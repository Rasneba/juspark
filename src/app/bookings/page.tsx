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

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: "#D5F5E3", color: "var(--success)" },
  active: { bg: "#D5F5E3", color: "var(--success)" },
  completed: { bg: "#EEF4FF", color: "var(--accent)" },
  pending: { bg: "#FEF9E7", color: "#D4A017" },
  cancelled: { bg: "#FADBD8", color: "var(--danger)" },
  expired: { bg: "#F5F5F5", color: "var(--muted-foreground)" },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = "/auth/login"; return; }
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/juspark/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch { }
    setLoading(false);
  };

  const isPast = (b: any) => {
    const status = (b.status || "").toLowerCase();
    return status === "completed" || status === "cancelled" || status === "expired";
  };

  const filtered = bookings.filter((b) => (tab === "past" ? isPast(b) : !isPast(b)));

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <header style={{ padding: "0.75rem 1rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/" style={{ padding: "0.4rem 0.6rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "1.1rem" }}>←</Link>
        <span style={{ fontSize: "0.95rem", fontWeight: "700", flex: 1 }}>My Bookings</span>
        <Link href="/search" style={{ padding: "0.35rem 0.7rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600" }}>Search</Link>
      </header>

      <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)", marginBottom: "1rem" }}>My Bookings</h1>

        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setTab("active")}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "999px",
              border: `1px solid ${tab === "active" ? "var(--primary)" : "var(--border)"}`,
              background: tab === "active" ? "var(--primary)" : "white",
              color: tab === "active" ? "white" : "var(--foreground)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Active
          </button>
          <button
            onClick={() => setTab("past")}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "999px",
              border: `1px solid ${tab === "past" ? "var(--primary)" : "var(--border)"}`,
              background: tab === "past" ? "var(--primary)" : "white",
              color: tab === "past" ? "white" : "var(--foreground)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Past
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.25rem" }}>
              {tab === "active" ? "No active bookings" : "No past bookings"}
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {tab === "active" ? "Find and book a parking space" : "Past bookings appear here"}
            </p>
            {tab === "active" && (
              <Link href="/search" style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600" }}>
                Search Parking
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((booking) => {
              const statusKey = (booking.status || "").toLowerCase();
              const statusStyle = STATUS_STYLES[statusKey] || { bg: "#F5F5F5", color: "var(--muted-foreground)" };
              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    background: "white",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.125rem" }}>
                      {booking.space_name || booking.spaceName || booking.space?.name || "Parking Space"}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {booking.date && <span>{booking.date}</span>}
                      {booking.duration && <span>{booking.duration}h</span>}
                      {booking.amount && <span>ETB {booking.amount}</span>}
                    </div>
                  </div>
                  <span style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    textTransform: "capitalize",
                    flexShrink: 0,
                  }}>
                    {booking.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
