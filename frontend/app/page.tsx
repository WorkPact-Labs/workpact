import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center pt-20 pb-32">
      <div className="mb-4 text-xs font-medium tracking-widest text-indigo-400 uppercase">
        Built on Stellar · Powered by Soroban
      </div>

      <h1 className="text-5xl font-bold text-white leading-tight max-w-2xl mb-6">
        Freelance without the&nbsp;
        <span className="text-indigo-400">middleman</span>
      </h1>

      <p className="text-gray-400 text-lg max-w-xl mb-10">
        WorkPact locks client funds in a Soroban smart contract and releases each
        milestone payment automatically on approval — trustless, transparent, instant.
      </p>

      <div className="flex gap-4">
        <Link
          href="/jobs/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Post a Job
        </Link>
        <Link
          href="/jobs"
          className="border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Browse Jobs
        </Link>
      </div>

      <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-left">
        {[
          {
            title: "Escrow on creation",
            body: "Client funds are locked the moment a job is funded. No trust required.",
          },
          {
            title: "Milestone-by-milestone",
            body: "Break any job into milestones. Each approval releases only that slice of funds.",
          },
          {
            title: "Built-in disputes",
            body: "Either party can freeze funds and raise a dispute. Arbitration coming soon.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-white font-semibold mb-2">{f.title}</div>
            <div className="text-gray-400 text-sm">{f.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
