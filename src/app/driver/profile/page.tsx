"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DriverProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      loadBookings(token);
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const loadBookings = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("accessMode");
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
          Loading profile...
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => !["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status));
  const pastBookings = bookings.filter((b) => ["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status));
  const totalSpent = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "white", borderBottom: "1px solid #e5e7eb", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/" style={{ padding: "0.35rem 0.55rem", background: "#f3f4f6", borderRadius: 8, fontSize: "1rem", textDecoration: "none", color: "#1B1B1B" }}>←</Link>
        <span style={{ fontSize: "1rem", fontWeight: "700", flex: 1 }}>My Profile</span>
      </header>

      <div style={{ padding: "1rem", maxWidth: "500px", margin: "0 auto" }}>
        {/* User Card */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1.25rem", marginBottom: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #4A90D9, #1B1B1B)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.4rem", fontWeight: "700", flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.1rem", color: "#111827" }}>{user.name || "User"}</h2>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
              {user.phone && <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{user.phone}</p>}
            </div>
          </div>

          <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: 999, background: "#D5F5E3", color: "#059669", fontSize: "0.75rem", fontWeight: "600" }}>
            🚗 Driver Account
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1B1B1B" }}>{bookings.length}</div>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: "500" }}>Total Bookings</div>
          </div>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#4A90D9" }}>{activeBookings.length}</div>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: "500" }}>Active Now</div>
          </div>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#059669" }}>ETB {totalSpent.toFixed(0)}</div>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: "500" }}>Total Spent</div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          <Link href="/search" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "1.2rem" }}>🔍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>Find Parking</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Search nearby parking spaces</div>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </Link>

          <Link href="/search/nearby" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "1.2rem" }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>Nearby Search</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Find spots closest to you</div>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </Link>

          <Link href="/map" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "1.2rem" }}>🗺</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>Map View</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Explore on the map</div>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </Link>

          <Link href="/bookings" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "1.2rem" }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>My Bookings</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{activeBookings.length} active, {pastBookings.length} past</div>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </Link>

          <Link href="/host" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "1.2rem" }}>🏠</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>Switch to Host</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Manage your parking spaces</div>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </Link>
        </div>

        {/* Recent Bookings */}
        {pastBookings.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#374151", marginBottom: "0.5rem" }}>Recent Bookings</h3>
            {pastBookings.slice(0, 3).map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: "0.35rem" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.8rem", color: "#111827" }}>{b.space?.name || "Parking"}</div>
                  <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>ETB {b.totalAmount || 0}</div>
                </div>
                <span style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: 999,
                  fontSize: "0.6rem",
                  fontWeight: "600",
                  background: b.status === "COMPLETED" ? "#D5F5E3" : "#FADBD8",
                  color: b.status === "COMPLETED" ? "#059669" : "#DC2626",
                  textTransform: "capitalize",
                }}>
                  {b.status?.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.7rem",
            borderRadius: 10,
            border: "1px solid #FCA5A5",
            background: "white",
            color: "#DC2626",
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
