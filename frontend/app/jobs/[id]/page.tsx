"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getJob,
  buildFundJob,
  buildSubmitMilestone,
  buildApproveMilestone,
  buildRaiseDispute,
  server,
  NETWORK_PASSPHRASE,
  type Job,
} from "@/lib/contract";
import { connectWallet, signTransaction } from "@/lib/wallet";
import { Transaction } from "@stellar/stellar-sdk";

const MILESTONE_STATUS_STYLES: Record<string, string> = {
  Pending: "text-gray-400",
  Submitted: "text-yellow-400",
  Approved: "text-green-400",
  Disputed: "text-red-400",
};

export default function JobDetailPage() {
  const { id } = useParams();
  const jobId = Number(id);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);

  async function loadJob() {
    setLoading(true);
    try {
      const data = await getJob(jobId);
      setJob(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadJob(); }, [jobId]);

  async function send(buildFn: () => Promise<string>) {
    setError("");
    setTxLoading(true);
    try {
      let addr = wallet;
      if (!addr) {
        addr = await connectWallet();
        setWallet(addr);
      }
      const xdr = await buildFn();
      const signed = await signTransaction(xdr);
      const tx = new Transaction(signed, NETWORK_PASSPHRASE);
      await server.sendTransaction(tx);
      await loadJob();
    } catch (e: any) {
      setError(e.message || "Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading...</div>;
  if (!job) return <div className="text-gray-500 text-sm">Job not found.</div>;

  const isClient = wallet === job.client;
  const isFreelancer = wallet === job.freelancer;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Job #{jobId}</h1>
        <span className="text-sm bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
          {job.status}
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Client</span>
          <span className="font-mono text-gray-300">{job.client}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Freelancer</span>
          <span className="font-mono text-gray-300">{job.freelancer}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total</span>
          <span className="text-white font-medium">
            {(Number(job.total_amount) / 1e7).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Fund button */}
      {job.status === "Open" && (
        <button
          disabled={txLoading}
          onClick={() => send(() => {
            const addr = wallet!;
            return buildFundJob(addr, jobId);
          })}
          className="w-full mb-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {txLoading ? "Processing..." : "Fund Escrow"}
        </button>
      )}

      {/* Dispute button */}
      {job.status === "Active" && (
        <button
          disabled={txLoading}
          onClick={() => send(() => {
            const addr = wallet!;
            return buildRaiseDispute(addr, jobId);
          })}
          className="w-full mb-6 border border-red-800 hover:border-red-600 text-red-400 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          Raise Dispute
        </button>
      )}

      {/* Milestones */}
      <h2 className="text-lg font-semibold mb-3">Milestones</h2>
      <div className="space-y-3">
        {job.milestones.map((m, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-white font-medium">
                Milestone {i + 1} — {(Number(m.amount) / 1e7).toFixed(2)}
              </div>
              <div className={`text-xs mt-0.5 ${MILESTONE_STATUS_STYLES[m.status]}`}>
                {m.status}
              </div>
            </div>

            <div className="flex gap-2">
              {m.status === "Pending" && job.status === "Active" && isFreelancer && (
                <button
                  disabled={txLoading}
                  onClick={() => send(() => buildSubmitMilestone(wallet!, jobId, i))}
                  className="text-xs bg-yellow-800 hover:bg-yellow-700 text-yellow-200 px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Submit
                </button>
              )}
              {m.status === "Submitted" && isClient && (
                <button
                  disabled={txLoading}
                  onClick={() => send(() => buildApproveMilestone(wallet!, jobId, i))}
                  className="text-xs bg-green-800 hover:bg-green-700 text-green-200 px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </div>
  );
}
