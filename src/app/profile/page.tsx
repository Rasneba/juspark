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
      <header style={{ padding: "1rem 2rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)", textDecoration: "none" }}>PARKme Ethiopia</Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/search" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Search</Link>
          <Link href="/host" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Host</Link>
          <Link href="/profile" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>Profile</Link>
        </nav>
      </header>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)", marginBottom: "1.5rem" }}>My Profile</h1>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: "700" }}>
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 style={{ fontWeight: "700", fontSize: "1.125rem" }}>{user.name || "User"}</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{user.email}</p>
            </div>
          </div>
          <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "999px", background: mode === "host" ? "#EEF4FF" : "#D5F5E3", color: mode === "host" ? "var(--accent)" : "var(--success)", fontSize: "0.8rem", fontWeight: "600", textTransform: "capitalize" }}>
            {mode} Mode
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
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

        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit", transition: "box-shadow 0.2s" }}>
              <span style={{ fontSize: "1.5rem" }}>{link.icon}</span>
              <div>
                <div style={{ fontWeight: "600" }}>{link.label}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{link.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--muted-foreground)" }}>→</span>
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            border: "1px solid var(--danger)",
            background: "white",
            color: "var(--danger)",
            fontWeight: "700",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
