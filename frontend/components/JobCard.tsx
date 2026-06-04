import Link from "next/link";
import type { Job } from "@/lib/contract";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-blue-900 text-blue-300",
  Active: "bg-green-900 text-green-300",
  Completed: "bg-gray-800 text-gray-400",
  Cancelled: "bg-red-900 text-red-300",
  Disputed: "bg-yellow-900 text-yellow-300",
};

interface Props {
  jobId: number;
  job: Job;
}

export default function JobCard({ jobId, job }: Props) {
  const approved = job.milestones.filter((m) => m.status === "Approved").length;
  const total = job.milestones.length;

  return (
    <Link
      href={`/jobs/${jobId}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-xs font-mono">Job #{jobId}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[job.status] ?? ""}`}>
          {job.status}
        </span>
      </div>

      <div className="text-sm text-gray-300 font-mono mb-1 truncate">
        {job.client.slice(0, 8)}...{job.client.slice(-4)}
        <span className="text-gray-600 mx-2">→</span>
        {job.freelancer.slice(0, 8)}...{job.freelancer.slice(-4)}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{total} milestone{total !== 1 ? "s" : ""}</span>
        <span>{approved}/{total} approved</span>
      </div>

      <div className="mt-2 w-full bg-gray-800 rounded-full h-1">
        <div
          className="bg-indigo-500 h-1 rounded-full transition-all"
          style={{ width: total > 0 ? `${(approved / total) * 100}%` : "0%" }}
        />
      </div>
    </Link>
  );
}
