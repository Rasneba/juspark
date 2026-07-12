"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"driver" | "host">("driver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Name, email and password required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Try again");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans antialiased">
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#128a42]" />
        <div className="flex-1 bg-[#facc15]" />
        <div className="flex-1 bg-[#d92323]" />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-14 h-14 bg-gradient-to-r from-[#128a42] via-[#facc15] to-[#d92323] p-[2px] rounded-2xl shadow-2xl mx-auto mb-3 hover:scale-105 transition-transform">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-xl font-black">🅿</span>
                </div>
              </div>
            </Link>
            <h1 className="font-display font-extrabold text-2xl tracking-tight">Create Account</h1>
            <p className="text-zinc-500 text-sm mt-1">Join PARKme Ethiopia today</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex gap-1.5 mb-5 p-1 bg-zinc-100 rounded-2xl">
              <button onClick={() => setSelectedRole("driver")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "driver" ? "bg-[#128a42] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}>
                🔍 Driver
              </button>
              <button onClick={() => setSelectedRole("host")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "host" ? "bg-[#128a42] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}>
                💰 Host
              </button>
            </div>

            {selectedRole === "host" && (
              <div className="px-4 py-3 bg-[#128a42]/5 border border-[#128a42]/20 text-[#128a42] rounded-2xl mb-4 text-xs leading-relaxed">
                List your parking space and earn money. Switch roles anytime.
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-[#d92323]/10 border border-[#d92323]/30 text-[#d92323] rounded-2xl mb-4 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all" />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-bold text-zinc-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all" />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-bold text-zinc-700 mb-1">Phone (optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9XX XXX XXXX"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all" />
              </div>
              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#128a42] hover:bg-[#0f7a39] text-white border-none rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#128a42]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="text-center mt-4 text-xs">
              <span className="text-zinc-500">Have an account? </span>
              <Link href="/auth/login" className="text-[#128a42] font-bold hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
