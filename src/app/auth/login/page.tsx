"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
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
      window.location.href = selectedRole === "host" ? "/host" : "/search";
    } catch (e: any) {
      setError(e.message || "Invalid credentials");
    }
    setLoading(false);
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "guest@parkme.et", password: "admin123" }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("accessMode", "guest");
        window.location.href = "/search";
      } else {
        setError("Guest access unavailable. Try registering.");
      }
    } catch {
      setError("Guest access unavailable. Try registering.");
    }
    setLoading(false);
  };

  const handleHostAccess = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "host@parkme.et", password: "admin123" }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("accessMode", "host");
        window.location.href = "/host";
      } else {
        setError("Host access unavailable. Try registering.");
      }
    } catch {
      setError("Host access unavailable. Try registering.");
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
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "white" }}>PARKme Ethiopia</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.25rem", fontSize: "0.9rem" }}>Find & book parking in seconds</p>
          </div>

          {/* Two access buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <button onClick={handleGuestAccess} disabled={loading}
              style={{ flex: 1, padding: "1rem", borderRadius: "var(--radius)", border: "none", background: "var(--accent)", color: "white", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.95rem", opacity: loading ? 0.6 : 1 }}>
              🔍 Guest Access
            </button>
            <button onClick={handleHostAccess} disabled={loading}
              style={{ flex: 1, padding: "1rem", borderRadius: "var(--radius)", border: "none", background: "var(--success)", color: "white", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.95rem", opacity: loading ? 0.6 : 1 }}>
              💰 Host Access
            </button>
          </div>

          {error && <div style={{ padding: "0.65rem", background: "#FEE2E2", color: "var(--danger)", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.8rem" }}>{error}</div>}

          {/* Role selector + email form */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem" }}>
              <button onClick={() => setSelectedRole("guest")} style={{ flex: 1, padding: "0.55rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "guest" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "guest" ? "var(--primary)" : "white", color: selectedRole === "guest" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.8rem" }}>
                Driver Sign In
              </button>
              <button onClick={() => setSelectedRole("host")} style={{ flex: 1, padding: "0.55rem", borderRadius: "var(--radius)", border: `2px solid ${selectedRole === "host" ? "var(--primary)" : "var(--border)"}`, background: selectedRole === "host" ? "var(--primary)" : "white", color: selectedRole === "host" ? "white" : "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "0.8rem" }}>
                Host Sign In
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "0.75rem" }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                  style={{ width: "100%", padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", background: "var(--muted)" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                  style={{ width: "100%", padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", background: "var(--muted)" }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "0.75rem", background: loading ? "var(--muted)" : "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: "0.95rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing in..." : selectedRole === "host" ? "Sign In as Host" : "Sign In as Driver"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--muted-foreground)" }}>No account? </span>
              <Link href="/auth/register" style={{ color: "var(--accent)", fontWeight: "700" }}>Sign Up</Link>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "0.75rem", color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>
            Test: guest@parkme.et / host@parkme.et — Password: admin123
          </div>
        </div>
      </div>
    </div>
  );
}
