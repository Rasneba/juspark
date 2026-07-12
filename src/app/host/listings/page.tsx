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

export default function HostListingsPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = "/auth/login"; return; }
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/juspark/host/spaces");
      if (res.ok) {
        const data = await res.json();
        setSpaces(Array.isArray(data) ? data : []);
      }
    } catch { }
    setLoading(false);
  };

  const toggleActive = async (space: any) => {
    const id = space.id;
    const isActive = space.is_active !== false && space.isActive !== false;
    setTogglingId(id);
    try {
      await apiFetch(`/api/juspark/spaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !isActive }),
      });
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, is_active: !isActive, isActive: !isActive } : s
        )
      );
    } catch { }
    setTogglingId(null);
  };

  const deleteSpace = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this space? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/juspark/spaces/${id}`, { method: "DELETE" });
      if (res.ok) setSpaces((prev) => prev.filter((s) => s.id !== id));
    } catch { }
    setDeletingId(null);
  };

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
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)" }}>Manage Listings</h1>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}>{spaces.length} total spaces</p>
          </div>
          <Link href="/host/add" style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "700" }}>+ Add Space</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Loading listings...</div>
        ) : spaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>No listings yet</p>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1rem" }}>Add your first parking space to get started</p>
            <Link href="/host/add" style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600" }}>+ Add Space</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {spaces.map((space) => {
              const isActive = space.is_active !== false && space.isActive !== false;
              const price = space.pricing?.[0];
              return (
                <div key={space.id} style={{ padding: "1.25rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <h3 style={{ fontWeight: "700" }}>{space.name}</h3>
                        <span style={{
                          padding: "0.125rem 0.5rem",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: "600",
                          background: isActive ? "#D5F5E3" : "#FADBD8",
                          color: isActive ? "var(--success)" : "var(--danger)",
                        }}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>{space.address}</p>
                      <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                        <span>{space.total_spots || space.totalSpots || 0} spots</span>
                        <span>{space.booking_count || space.bookingCount || 0} bookings</span>
                        {price && <span>ETB {price.price}/{price.rate_type === "hourly" ? "hr" : price.rate_type === "daily" ? "day" : "mo"}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => toggleActive(space)}
                        disabled={togglingId === space.id}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                          background: isActive ? "#FEE2E2" : "#D5F5E3",
                          color: isActive ? "var(--danger)" : "var(--success)",
                          fontWeight: "600",
                          fontSize: "0.8rem",
                          cursor: togglingId === space.id ? "not-allowed" : "pointer",
                          opacity: togglingId === space.id ? 0.6 : 1,
                        }}
                      >
                        {togglingId === space.id ? "..." : isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteSpace(space.id)}
                        disabled={deletingId === space.id}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--danger)",
                          background: "white",
                          color: "var(--danger)",
                          fontWeight: "600",
                          fontSize: "0.8rem",
                          cursor: deletingId === space.id ? "not-allowed" : "pointer",
                          opacity: deletingId === space.id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === space.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
