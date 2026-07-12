"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"driver" | "host">("driver");
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
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem", background: "var(--muted)" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "28px" }}>
              <span style={{ color: "white" }}>P</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)" }}>PARKme Ethiopia</h1>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}>Find & book parking in seconds</p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <button onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "driver" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "driver" ? "var(--primary)" : "white", color: selectedRole === "driver" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>
              Find Parking
            </button>
            <button onClick={() => setSelectedRole("host")} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "host" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "host" ? "var(--primary)" : "white", color: selectedRole === "host" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>
              List My Space
            </button>
          </div>

          <form onSubmit={handleLogin} style={{ background: "white", padding: "2rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            {error && <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "var(--danger)", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }} />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Signing in..." : selectedRole === "host" ? "Sign In as Host" : "Sign In as Driver"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              Don&apos;t have an account? <Link href="/auth/register" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>Sign Up</Link>
            </p>
          </div>

          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
            Test accounts: guest@parkme.et / host@parkme.et<br />Password: admin123
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: "var(--primary)", display: { md: "flex", sm: "none" } } as any} className="hidden md:flex flex-col justify-center items-center p-8">
        <div style={{ color: "white", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "1rem" }}>Park smarter across Ethiopia</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.8, lineHeight: 1.6 }}>Search, compare, and book parking spaces in Addis Ababa and beyond. Real-time availability, transparent pricing, secure payments.</p>
        </div>
      </div>
    </div>
  );
}
