import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK === "mainnet"
  ? Networks.PUBLIC
  : Networks.TESTNET;

export const server = new Server(RPC_URL);

export type JobStatus = "Open" | "Active" | "Completed" | "Cancelled" | "Disputed";
export type MilestoneStatus = "Pending" | "Submitted" | "Approved" | "Disputed";

export interface Milestone {
  amount: bigint;
  status: MilestoneStatus;
}

export interface Job {
  client: string;
  freelancer: string;
  token: string;
  total_amount: bigint;
  milestones: Milestone[];
  status: JobStatus;
}

function contract() {
  return new Contract(CONTRACT_ID);
}

export async function getJob(jobId: number): Promise<Job | null> {
  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"),
      { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(
        contract().call("get_job", nativeToScVal(jobId, { type: "u64" }))
      )
      .setTimeout(30)
      .build()
  );

  if ("error" in result || !result.result?.retval) return null;

  const val = result.result.retval;
  if (val.switch() === xdr.ScValType.scvVoid()) return null;

  return scValToNative(val) as Job;
}

export async function getJobCount(): Promise<number> {
  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"),
      { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(contract().call("job_count"))
      .setTimeout(30)
      .build()
  );

  if ("error" in result || !result.result?.retval) return 0;
  return Number(scValToNative(result.result.retval));
}

export async function buildCreateJob(
  sourcePublicKey: string,
  freelancer: string,
  token: string,
  milestoneAmounts: bigint[]
) {
  const account = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract().call(
        "create_job",
        new Address(sourcePublicKey).toScVal(),
        new Address(freelancer).toScVal(),
        new Address(token).toScVal(),
        nativeToScVal(milestoneAmounts, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}

export async function buildFundJob(sourcePublicKey: string, jobId: number) {
  const account = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract().call("fund_job", nativeToScVal(jobId, { type: "u64" }))
    )
    .setTimeout(30)
    .build();

  return (await server.prepareTransaction(tx)).toXDR();
}

export async function buildSubmitMilestone(
  sourcePublicKey: string,
  jobId: number,
  milestoneIndex: number
) {
  const account = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract().call(
        "submit_milestone",
        nativeToScVal(jobId, { type: "u64" }),
        nativeToScVal(milestoneIndex, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  return (await server.prepareTransaction(tx)).toXDR();
}

export async function buildApproveMilestone(
  sourcePublicKey: string,
  jobId: number,
  milestoneIndex: number
) {
  const account = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract().call(
        "approve_milestone",
        nativeToScVal(jobId, { type: "u64" }),
        nativeToScVal(milestoneIndex, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  return (await server.prepareTransaction(tx)).toXDR();
}

export async function buildRaiseDispute(sourcePublicKey: string, jobId: number) {
  const account = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract().call("raise_dispute", nativeToScVal(jobId, { type: "u64" }))
    )
    .setTimeout(30)
    .build();

  return (await server.prepareTransaction(tx)).toXDR();
}
