# WorkPact

A decentralized freelance escrow protocol built on [Stellar](https://stellar.org) using [Soroban](https://soroban.stellar.org) smart contracts.

WorkPact lets clients and freelancers create trustless work agreements — funds are locked in a smart contract and released automatically as milestones are approved. No intermediaries, no withheld payments.

## How It Works

1. **Client creates a job** — defines the freelancer, token, and milestone breakdown
2. **Client funds escrow** — transfers the full amount to the contract
3. **Freelancer submits milestones** — marks work as done when ready
4. **Client approves** — each approval instantly releases that milestone's payment
5. **Disputes** — either party can flag a dispute; an arbitrator resolves and directs funds

## Architecture

```
workpact/
├── contracts/
│   └── escrow/          # Soroban smart contract (Rust)
│       └── src/lib.rs
├── frontend/            # Coming soon — Next.js UI
└── .github/
    └── ISSUE_TEMPLATE/
```

## Contract Functions

| Function | Who Calls | Description |
|---|---|---|
| `initialize(admin)` | Deployer | One-time setup |
| `create_job(client, freelancer, token, milestones)` | Client | Creates a new job |
| `fund_job(job_id)` | Client | Locks payment in escrow |
| `submit_milestone(job_id, index)` | Freelancer | Marks milestone done |
| `approve_milestone(job_id, index)` | Client | Releases milestone payment |
| `raise_dispute(job_id)` | Either party | Flags job for arbitration |
| `resolve_dispute(job_id, recipient, amount)` | Admin | Directs locked funds |
| `cancel_job(job_id)` | Client | Cancels before funding |

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Soroban (Rust) |
| Blockchain | Stellar Testnet / Mainnet |
| Frontend (planned) | Next.js, TypeScript, Stellar Wallets Kit |

## Getting Started

### Prerequisites

- Rust + Cargo
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli)

### Build

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

### Run Tests

```bash
cd contracts
cargo test
```

### Deploy (Testnet)

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/workpact_escrow.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

## Contributing

This project is actively looking for contributors. Check the [open issues](https://github.com/dannyy2000/workpact/issues) for good first issues.

Areas that need help:
- Contract tests
- Frontend UI (Next.js)
- SDK / helper library
- Documentation

## License

MIT
