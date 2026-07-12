"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";

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
        apiFetch("/api/juspark/host/dashboard"),
        apiFetch("/api/juspark/host/spaces"),
      ]);
      if (dashRes.ok) setStats(await dashRes.json());
      if (spacesRes.ok) {
        const data = await spacesRes.json();
        setSpaces(Array.isArray(data) ? data : []);
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
      <header style={{ padding: "1rem 2rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)", textDecoration: "none" }}>PARKme Ethiopia</Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/search" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Search</Link>
          <Link href="/host" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>Host</Link>
          <Link href="/profile" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>Profile</Link>
        </nav>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)" }}>Host Dashboard</h1>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}>Manage your parking spaces and earnings</p>
          </div>
          <Link href="/host/add" style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "700" }}>+ Add Space</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Loading dashboard...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {statCards.map((card) => (
                <div key={card.label} style={{ padding: "1.5rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", fontWeight: "500" }}>{card.label}</span>
                    <span style={{ fontSize: "1.5rem" }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--primary)" }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Your Spaces</h2>
              <Link href="/host/listings" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none", fontSize: "0.875rem" }}>Manage Listings →</Link>
            </div>

            {spaces.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>No spaces yet</p>
                <p style={{ color: "var(--muted-foreground)", marginBottom: "1rem" }}>Add your first parking space to start earning</p>
                <Link href="/host/add" style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600" }}>+ Add Space</Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {spaces.map((space) => (
                  <div key={space.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: "700", marginBottom: "0.125rem" }}>{space.name}</h3>
                      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{space.address}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{space.booking_count || space.bookingCount || 0} bookings</span>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        background: (space.is_active !== false && space.isActive !== false) ? "#D5F5E3" : "#FADBD8",
                        color: (space.is_active !== false && space.isActive !== false) ? "var(--success)" : "var(--danger)",
                      }}>
                        {space.is_active !== false && space.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
