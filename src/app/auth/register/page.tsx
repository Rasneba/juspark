"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
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
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message || "Try again");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--primary)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
        <div style={{ maxWidth: "420px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", fontSize: "24px" }}>
              <span style={{ color: "white" }}>🅿</span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "white" }}>Create Account</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.25rem", fontSize: "0.9rem" }}>Join PARKme Ethiopia today</p>
          </div>

          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <button onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "0.65rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "driver" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "driver" ? "var(--primary)" : "white", color: selectedRole === "driver" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem" }}>
                🔍 Driver
              </button>
              <button onClick={() => setSelectedRole("host")} style={{ flex: 1, padding: "0.65rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "host" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "host" ? "var(--primary)" : "white", color: selectedRole === "host" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem" }}>
                💰 Host
              </button>
            </div>

            {selectedRole === "host" && (
              <div style={{ padding: "0.6rem", background: "#EEF4FF", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.8rem", color: "var(--accent)", lineHeight: "1.4" }}>
                List your parking space and earn money. Switch roles anytime.
              </div>
            )}

            {error && <div style={{ padding: "0.65rem", background: "#FEE2E2", color: "var(--danger)", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.8rem" }}>{error}</div>}

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.2rem" }}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  style={{ width: "100%", padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", background: "var(--muted)" }} />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.2rem" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: "100%", padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", background: "var(--muted)" }} />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.2rem" }}>Phone (optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9XX XXX XXXX"
                  style={{ width: "100%", padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", background: "var(--muted)" }} />
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.2rem" }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                  style={{ width: "100%", padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", background: "var(--muted)" }} />
              </div>

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "0.8rem", background: loading ? "var(--muted)" : "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Have an account? </span>
              <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: "700" }}>Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
