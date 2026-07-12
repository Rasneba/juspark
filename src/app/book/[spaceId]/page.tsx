"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers as Record<string, string> };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export default function BookSpacePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(1);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSpace();
  }, []);

  const loadSpace = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/juspark/spaces/${spaceId}`);
      if (res.ok) setSpace(await res.json());
    } catch { }
    setLoading(false);
  };

  const pricing = space?.pricing?.[0];
  const hourlyRate = pricing?.rate_type === "hourly" ? Number(pricing.price) : pricing?.rate_type === "daily" ? Number(pricing.price) / 24 : 0;
  const total = (hourlyRate * duration).toFixed(2);

  const handleBook = async () => {
    const token = getToken();
    if (!token) { window.location.href = "/auth/login"; return; }
    if (!vehiclePlate.trim()) { setError("Please enter your vehicle plate number"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/api/juspark/bookings", {
        method: "POST",
        body: JSON.stringify({
          space_id: spaceId,
          duration_hours: duration,
          vehicle_plate: vehiclePlate.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Booking failed");
      }
      window.location.href = "/bookings";
    } catch (e: any) {
      setError(e.message || "Failed to create booking");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
        Loading space details...
      </div>
    );
  }

  if (!space) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>Space not found</p>
        <Link href="/search" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>← Back to Search</Link>
      </div>
    );
  }

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
        <Link href={`/space/${spaceId}`} style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none", fontSize: "0.875rem", display: "inline-block", marginBottom: "1rem" }}>← Back to Space</Link>

        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)", marginBottom: "0.25rem" }}>Book Parking</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>{space.name}</p>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem" }}>Space Details</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Address</span>
              <span style={{ fontWeight: "600" }}>{space.address}</span>
            </div>
            {pricing && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Rate</span>
                <span style={{ fontWeight: "600" }}>ETB {pricing.price}/{pricing.rate_type === "hourly" ? "hour" : pricing.rate_type === "daily" ? "day" : "month"}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Available Spots</span>
              <span style={{ fontWeight: "600" }}>{space.available_spots || space.availableSpots || 0}/{space.total_spots || space.totalSpots || 0}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem" }}>Booking Details</h2>

          {error && (
            <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "var(--danger)", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>Duration (hours)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setDuration((d) => Math.max(1, d - 1))}
                style={{ width: "36px", height: "36px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "white", fontSize: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                −
              </button>
              <span style={{ fontSize: "1.25rem", fontWeight: "700", minWidth: "3rem", textAlign: "center" }}>{duration}</span>
              <button
                onClick={() => setDuration((d) => Math.min(24, d + 1))}
                style={{ width: "36px", height: "36px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "white", fontSize: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>Vehicle Plate Number</label>
            <input
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="e.g. AA-12345"
              style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ padding: "1rem", background: "var(--muted)", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Rate</span>
              <span>ETB {hourlyRate.toFixed(2)} × {duration}h</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>Total</span>
              <span style={{ fontWeight: "800", fontSize: "1.25rem", color: "var(--primary)" }}>ETB {total}</span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              fontSize: "1rem",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
