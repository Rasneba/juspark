"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers as Record<string, string> };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export default function HostDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = "/auth/login"; return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, spacesRes] = await Promise.all([
        apiFetch("/api/owner/dashboard"),
        apiFetch("/api/owner/listings"),
      ]);
      if (dashRes.ok) setStats(await dashRes.json());
      if (spacesRes.ok) {
        const data = await spacesRes.json();
        setSpaces(data.spaces || []);
      }
    } catch { }
    setLoading(false);
  };

  const statCards = [
    { label: "Total Earnings", value: `ETB ${stats?.total_earnings || stats?.totalEarnings || 0}`, icon: "💰" },
    { label: "Pending Payout", value: `ETB ${stats?.pending_payout || stats?.pendingPayout || 0}`, icon: "⏳" },
    { label: "Total Bookings", value: stats?.total_bookings || stats?.totalBookings || 0, icon: "📋" },
    { label: "Average Rating", value: stats?.average_rating || stats?.averageRating || "—", icon: "⭐" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <header style={{ padding: "0.75rem 1rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href="/" style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)", textDecoration: "none" }}>PARKme Ethiopia</Link>
        <span style={{ flex: 1 }} />
        <Link href="/search" style={{ padding: "0.35rem 0.7rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: "600", textDecoration: "none" }}>Search</Link>
        <Link href="/profile" style={{ padding: "0.35rem 0.7rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.8rem" }}>Profile</Link>
      </header>

      <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)" }}>Host Dashboard</h1>
          <Link href="/host/add" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "700", fontSize: "0.85rem" }}>+ Add</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {statCards.map((card) => (
                <div key={card.label} style={{ padding: "1rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: "500" }}>{card.label}</span>
                    <span style={{ fontSize: "1.1rem" }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)" }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700" }}>Your Spaces</h2>
              <Link href="/host/listings" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none", fontSize: "0.8rem" }}>Manage →</Link>
            </div>

            {spaces.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.25rem" }}>No spaces yet</p>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>Add your first parking space to start earning</p>
                <Link href="/host/add" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem" }}>+ Add Space</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {spaces.map((space) => (
                  <Link key={space.id} href={`/space/${space.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: "700", marginBottom: "0.125rem", fontSize: "0.9rem" }}>{space.name}</h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{space.address}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{space.booking_count || space.bookingCount || 0} bookings</span>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "999px",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        background: (space.is_active !== false && space.isActive !== false) ? "#D5F5E3" : "#FADBD8",
                        color: (space.is_active !== false && space.isActive !== false) ? "var(--success)" : "var(--danger)",
                      }}>
                        {space.is_active !== false && space.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
