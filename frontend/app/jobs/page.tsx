"use client";

import { useEffect, useState } from "react";
import { getJobCount, getJob, type Job } from "@/lib/contract";
import JobCard from "@/components/JobCard";
import Link from "next/link";

export default function JobsPage() {
  const [jobs, setJobs] = useState<{ id: number; job: Job }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const count = await getJobCount();
        const results: { id: number; job: Job }[] = [];
        for (let i = 0; i < count; i++) {
          const job = await getJob(i);
          if (job) results.push({ id: i, job });
        }
        setJobs(results.reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link
          href="/jobs/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Post a Job
        </Link>
      </div>

      {loading && (
        <div className="text-gray-500 text-sm">Loading jobs...</div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No jobs yet.{" "}
          <Link href="/jobs/new" className="text-indigo-400 hover:underline">
            Post the first one.
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(({ id, job }) => (
          <JobCard key={id} jobId={id} job={job} />
        ))}
      </div>
    </div>
  );
}
