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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem", background: "var(--muted)" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "28px" }}>
              <span style={{ color: "white" }}>P</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)" }}>Create Account</h1>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}>Join PARKme Ethiopia today</p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <button onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "driver" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "driver" ? "var(--primary)" : "white", color: selectedRole === "driver" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>
              Driver
            </button>
            <button onClick={() => setSelectedRole("host")} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "host" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "host" ? "var(--primary)" : "white", color: selectedRole === "host" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>
              Host
            </button>
          </div>

          {selectedRole === "host" && (
            <div style={{ padding: "0.75rem", background: "#EEF4FF", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--accent)" }}>
              Hosts can list parking spaces and earn money. You can switch roles anytime.
            </div>
          )}

          <form onSubmit={handleRegister} style={{ background: "white", padding: "2rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            {error && <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "var(--danger)", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Phone (optional)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9XX XXX XXXX" style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }} />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              Already have an account? <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: "var(--primary)", display: { md: "flex", sm: "none" } } as any} className="hidden md:flex flex-col justify-center items-center p-8">
        <div style={{ color: "white", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "1rem" }}>Start earning with your parking space</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.8, lineHeight: 1.6 }}>List your unused parking space, set your prices, and earn money from drivers across Ethiopia.</p>
        </div>
      </div>
    </div>
  );
}
