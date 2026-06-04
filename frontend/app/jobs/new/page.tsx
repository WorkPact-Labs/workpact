"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildCreateJob } from "@/lib/contract";
import { connectWallet, signTransaction } from "@/lib/wallet";
import { server, NETWORK_PASSPHRASE } from "@/lib/contract";
import { Transaction } from "@stellar/stellar-sdk";

export default function NewJobPage() {
  const router = useRouter();
  const [freelancer, setFreelancer] = useState("");
  const [token, setToken] = useState("");
  const [milestones, setMilestones] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addMilestone() {
    setMilestones((prev) => [...prev, ""]);
  }

  function removeMilestone(i: number) {
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const clientAddress = await connectWallet();
      const amounts = milestones.map((m) => {
        const val = parseFloat(m);
        if (isNaN(val) || val <= 0) throw new Error("All milestone amounts must be positive numbers.");
        return BigInt(Math.round(val * 1e7));
      });

      const xdr = await buildCreateJob(clientAddress, freelancer, token, amounts);
      const signed = await signTransaction(xdr);
      const tx = new Transaction(signed, NETWORK_PASSPHRASE);
      await server.sendTransaction(tx);

      router.push("/jobs");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-8">Post a Job</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Freelancer address</label>
          <input
            value={freelancer}
            onChange={(e) => setFreelancer(e.target.value)}
            required
            placeholder="G..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Payment token (contract address)</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="C..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Milestones (amount each)</label>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={m}
                  onChange={(e) => {
                    const updated = [...milestones];
                    updated[i] = e.target.value;
                    setMilestones(updated);
                  }}
                  required
                  placeholder={`Milestone ${i + 1} amount`}
                  type="number"
                  min="0"
                  step="any"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-gray-500 hover:text-red-400 text-lg px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMilestone}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            + Add milestone
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {loading ? "Submitting..." : "Create Job"}
        </button>
      </form>
    </div>
  );
}
