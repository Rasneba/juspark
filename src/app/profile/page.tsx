"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"driver" | "host">("driver");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role === "host") setMode("host");
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleMode = (newMode: "driver" | "host") => {
    setMode(newMode);
    if (user) {
      const updated = { ...user, role: newMode };
      localStorage.setItem("user", JSON.stringify(updated));
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
        Loading...
      </div>
    );
  }

  const links = mode === "host"
    ? [
        { href: "/host", label: "Host Dashboard", desc: "View earnings and stats", icon: "📊" },
        { href: "/host/listings", label: "My Listings", desc: "Manage your parking spaces", icon: "📋" },
        { href: "/host/add", label: "Add New Space", desc: "List a new parking space", icon: "➕" },
        { href: "/bookings", label: "My Bookings", desc: "View your bookings", icon: "🕐" },
        { href: "/notifications", label: "Notifications", desc: "View alerts and messages", icon: "🔔" },
      ]
    : [
        { href: "/bookings", label: "My Bookings", desc: "View active and past bookings", icon: "📋" },
        { href: "/vehicles", label: "My Vehicles", desc: "Manage your vehicles", icon: "🚗" },
        { href: "/host", label: "Host Dashboard", desc: "Switch to host mode", icon: "🏠" },
        { href: "/notifications", label: "Notifications", desc: "View alerts and messages", icon: "🔔" },
      ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <header style={{ padding: "0.75rem 1rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/" style={{ padding: "0.4rem 0.6rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "1.1rem" }}>←</Link>
        <span style={{ fontSize: "0.95rem", fontWeight: "700", flex: 1 }}>Profile</span>
        <Link href="/search" style={{ padding: "0.35rem 0.7rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600" }}>Search</Link>
      </header>

      <div style={{ padding: "1rem", maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)", marginBottom: "1rem" }}>My Profile</h1>

        <div style={{ padding: "1rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.1rem", fontWeight: "700", flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 style={{ fontWeight: "700", fontSize: "0.95rem" }}>{user.name || "User"}</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{user.email}</p>
            </div>
          </div>
          <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "999px", background: mode === "host" ? "#EEF4FF" : "#D5F5E3", color: mode === "host" ? "var(--accent)" : "var(--success)", fontSize: "0.8rem", fontWeight: "600", textTransform: "capitalize" }}>
            {mode} Mode
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
          <button
            onClick={() => toggleMode("driver")}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "var(--radius)",
              border: `2px solid ${mode === "driver" ? "var(--primary)" : "var(--border)"}`,
              background: mode === "driver" ? "var(--primary)" : "white",
              color: mode === "driver" ? "white" : "var(--primary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            🚗 Driver Mode
          </button>
          <button
            onClick={() => toggleMode("host")}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "var(--radius)",
              border: `2px solid ${mode === "host" ? "var(--primary)" : "var(--border)"}`,
              background: mode === "host" ? "var(--primary)" : "white",
              color: mode === "host" ? "white" : "var(--primary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            🏠 Host Mode
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}>
              <span style={{ fontSize: "1.1rem" }}>{link.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>{link.label}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{link.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--muted-foreground)", fontSize: "0.9rem" }}>→</span>
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.65rem",
            borderRadius: "var(--radius)",
            border: "1px solid var(--danger)",
            background: "white",
            color: "var(--danger)",
            fontWeight: "700",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
