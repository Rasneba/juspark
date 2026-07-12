"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"guest" | "host">("guest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("accessMode", selectedRole);
      router.push(selectedRole === "host" ? "/host" : "/search");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid credentials");
    }
    setLoading(false);
  };

  const handleQuickAccess = async (role: "guest" | "host") => {
    setLoading(true);
    setError("");
    try {
      const creds = role === "guest"
        ? { email: "guest@parkme.et", password: "admin123" }
        : { email: "host@parkme.et", password: "admin123" };
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("accessMode", role);
        router.push(role === "host" ? "/host" : "/search");
      } else {
        setError(`${role === "guest" ? "Guest" : "Host"} access unavailable. Try registering.`);
      }
    } catch {
      setError("Connection failed. Please try again.");
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
            <h1 className="font-display font-extrabold text-2xl tracking-tight">PARKme <span className="text-[#128a42]">Ethiopia</span></h1>
            <p className="text-zinc-500 text-sm mt-1">Find & book parking in seconds</p>
          </div>

          <div className="flex gap-3 mb-5">
            <button onClick={() => handleQuickAccess("guest")} disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-[#128a42] hover:bg-[#0f7a39] text-white font-bold text-sm transition-all shadow-lg shadow-[#128a42]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-none">
              🔍 Guest Access
            </button>
            <button onClick={() => handleQuickAccess("host")} disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              💰 Host Access
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 bg-[#d92323]/10 border border-[#d92323]/30 text-[#d92323] rounded-2xl mb-4 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex gap-1.5 mb-5 p-1 bg-zinc-100 rounded-2xl">
              <button onClick={() => setSelectedRole("guest")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "guest" ? "bg-[#128a42] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}>
                Driver Sign In
              </button>
              <button onClick={() => setSelectedRole("host")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "host" ? "bg-[#128a42] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}>
                Host Sign In
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all" />
              </div>
              <div className="mb-5">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#128a42] hover:bg-[#0f7a39] text-white border-none rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#128a42]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Signing in..." : selectedRole === "host" ? "Sign In as Host" : "Sign In as Driver"}
              </button>
            </form>

            <div className="text-center mt-4 text-xs">
              <span className="text-zinc-500">No account? </span>
              <Link href="/auth/register" className="text-[#128a42] font-bold hover:underline">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
