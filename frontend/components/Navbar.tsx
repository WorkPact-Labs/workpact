"use client";

import Link from "next/link";
import { useState } from "react";
import { connectWallet } from "@/lib/wallet";

export default function Navbar() {
  const [address, setAddress] = useState<string | null>(null);

  async function handleConnect() {
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch {
      // user closed modal
    }
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-white font-bold text-xl tracking-tight">
        WorkPact
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/jobs" className="text-gray-400 hover:text-white text-sm transition-colors">
          Browse Jobs
        </Link>
        <Link href="/jobs/new" className="text-gray-400 hover:text-white text-sm transition-colors">
          Post a Job
        </Link>

        {address ? (
          <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full font-mono">
            {address.slice(0, 5)}...{address.slice(-4)}
          </span>
        ) : (
          <button
            onClick={handleConnect}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
