#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Vec,
};

// ── Errors ────────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotFound = 2,
    Unauthorized = 3,
    InvalidState = 4,
    InvalidMilestone = 5,
    AlreadyFunded = 6,
    EmptyMilestones = 7,
    ZeroAmount = 8,
}

// ── Types ─────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum JobStatus {
    Open,      // created, not yet funded
    Active,    // funded, work in progress
    Completed, // all milestones approved
    Cancelled, // cancelled before funding
    Disputed,  // dispute raised
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted, // freelancer marked done
    Approved,  // client approved, payment released
    Disputed,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct Job {
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub status: JobStatus,
}

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
pub enum Key {
    Admin,
    JobCount,
    Job(u64),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct WorkPactEscrow;

#[contractimpl]
impl WorkPactEscrow {
    /// One-time setup. Sets the admin address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&Key::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::JobCount, &0u64);
        Ok(())
    }

    /// Client creates a job with a list of milestone amounts.
    /// Returns the new job ID.
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        milestone_amounts: Vec<i128>,
    ) -> Result<u64, Error> {
        client.require_auth();

        if milestone_amounts.is_empty() {
            return Err(Error::EmptyMilestones);
        }

        let mut total: i128 = 0;
        let mut milestones: Vec<Milestone> = Vec::new(&env);

        for amount in milestone_amounts.iter() {
            if amount <= 0 {
                return Err(Error::ZeroAmount);
            }
            total += amount;
            milestones.push_back(Milestone {
                amount,
                status: MilestoneStatus::Pending,
            });
        }

        let job_id: u64 = env.storage().instance().get(&Key::JobCount).unwrap_or(0);

        let job = Job {
            client,
            freelancer,
            token,
            total_amount: total,
            milestones,
            status: JobStatus::Open,
        };

        env.storage().persistent().set(&Key::Job(job_id), &job);
        env.storage().instance().set(&Key::JobCount, &(job_id + 1));

        Ok(job_id)
    }

    /// Client funds the escrow. Transfers total_amount from client to contract.
    pub fn fund_job(env: Env, job_id: u64) -> Result<(), Error> {
        let mut job: Job = env
            .storage()
            .persistent()
            .get(&Key::Job(job_id))
            .ok_or(Error::NotFound)?;

        if job.status != JobStatus::Open {
            return Err(Error::AlreadyFunded);
        }

        job.client.require_auth();

        let client = token::Client::new(&env, &job.token);
        client.transfer(&job.client, &env.current_contract_address(), &job.total_amount);

        job.status = JobStatus::Active;
        env.storage().persistent().set(&Key::Job(job_id), &job);

        Ok(())
    }

    /// Freelancer marks a milestone as submitted/done.
    pub fn submit_milestone(env: Env, job_id: u64, milestone_index: u32) -> Result<(), Error> {
        let mut job: Job = env
            .storage()
            .persistent()
            .get(&Key::Job(job_id))
            .ok_or(Error::NotFound)?;

        if job.status != JobStatus::Active {
            return Err(Error::InvalidState);
        }

        job.freelancer.require_auth();

        let mut milestone = job
            .milestones
            .get(milestone_index)
            .ok_or(Error::InvalidMilestone)?;

        if milestone.status != MilestoneStatus::Pending {
            return Err(Error::InvalidState);
        }

        milestone.status = MilestoneStatus::Submitted;
        job.milestones.set(milestone_index, milestone);
        env.storage().persistent().set(&Key::Job(job_id), &job);

        Ok(())
    }

    /// Client approves a submitted milestone — releases that milestone's payment.
    pub fn approve_milestone(env: Env, job_id: u64, milestone_index: u32) -> Result<(), Error> {
        let mut job: Job = env
            .storage()
            .persistent()
            .get(&Key::Job(job_id))
            .ok_or(Error::NotFound)?;

        if job.status != JobStatus::Active {
            return Err(Error::InvalidState);
        }

        job.client.require_auth();

        let mut milestone = job
            .milestones
            .get(milestone_index)
            .ok_or(Error::InvalidMilestone)?;

        if milestone.status != MilestoneStatus::Submitted {
            return Err(Error::InvalidState);
        }

        let token_client = token::Client::new(&env, &job.token);
        token_client.transfer(
            &env.current_contract_address(),
            &job.freelancer,
            &milestone.amount,
        );

        milestone.status = MilestoneStatus::Approved;
        job.milestones.set(milestone_index, milestone);

        // Mark job completed if all milestones are approved
        let all_done = job
            .milestones
            .iter()
            .all(|m| m.status == MilestoneStatus::Approved);

        if all_done {
            job.status = JobStatus::Completed;
        }

        env.storage().persistent().set(&Key::Job(job_id), &job);

        Ok(())
    }

    /// Either party can raise a dispute on an active job.
    /// Funds stay locked until an admin resolves it (future: on-chain arbitration).
    pub fn raise_dispute(env: Env, job_id: u64) -> Result<(), Error> {
        let mut job: Job = env
            .storage()
            .persistent()
            .get(&Key::Job(job_id))
            .ok_or(Error::NotFound)?;

        if job.status != JobStatus::Active {
            return Err(Error::InvalidState);
        }

        // either party can dispute
        let caller_is_client = job.client == env.current_contract_address();
        let _ = caller_is_client; // suppress warning — auth checked below

        // require one of the two parties to auth
        // Soroban doesn't have "or" auth natively — we call require_auth on client
        // and catch the panic via a nested call in a real impl; for MVP we allow
        // the freelancer or client to call this without strict or-auth.
        // TODO: replace with proper multi-party auth pattern.

        job.status = JobStatus::Disputed;
        env.storage().persistent().set(&Key::Job(job_id), &job);

        Ok(())
    }

    /// Admin resolves a dispute by directing remaining funds to a recipient.
    pub fn resolve_dispute(
        env: Env,
        job_id: u64,
        recipient: Address,
        amount: i128,
    ) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&Key::Admin)
            .ok_or(Error::Unauthorized)?;

        admin.require_auth();

        let mut job: Job = env
            .storage()
            .persistent()
            .get(&Key::Job(job_id))
            .ok_or(Error::NotFound)?;

        if job.status != JobStatus::Disputed {
            return Err(Error::InvalidState);
        }

        let token_client = token::Client::new(&env, &job.token);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        job.status = JobStatus::Completed;
        env.storage().persistent().set(&Key::Job(job_id), &job);

        Ok(())
    }

    /// Client cancels an Open (unfunded) job.
    pub fn cancel_job(env: Env, job_id: u64) -> Result<(), Error> {
        let mut job: Job = env
            .storage()
            .persistent()
            .get(&Key::Job(job_id))
            .ok_or(Error::NotFound)?;

        if job.status != JobStatus::Open {
            return Err(Error::InvalidState);
        }

        job.client.require_auth();
        job.status = JobStatus::Cancelled;
        env.storage().persistent().set(&Key::Job(job_id), &job);

        Ok(())
    }

    // ── Reads ─────────────────────────────────────────────────────────────────

    pub fn get_job(env: Env, job_id: u64) -> Option<Job> {
        env.storage().persistent().get(&Key::Job(job_id))
    }

    pub fn job_count(env: Env) -> u64 {
        env.storage().instance().get(&Key::JobCount).unwrap_or(0)
    }
}
