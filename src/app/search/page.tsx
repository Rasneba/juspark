"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  return res;
}

export default function SearchPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 9.0054, lng: 38.7636 })
      );
    } else {
      setUserLocation({ lat: 9.0054, lng: 38.7636 });
    }
  }, []);

  useEffect(() => {
    if (userLocation) loadSpaces();
  }, [userLocation]);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/juspark/spaces?lat=${userLocation?.lat || 9.0054}&lng=${userLocation?.lng || 38.7636}&radius=10`);
      const data = await res.json();
      setSpaces(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
  };

  const filtered = spaces.filter((s) => {
    const matchQuery = !query || s.name?.toLowerCase().includes(query.toLowerCase()) || s.address?.toLowerCase().includes(query.toLowerCase());
    let matchFilter = true;
    if (activeFilter === "covered") matchFilter = s.is_covered || s.isCovered;
    else if (activeFilter === "ev") matchFilter = s.is_ev_charger || s.isEvCharger;
    else if (activeFilter === "24_7") matchFilter = s.is_24_7 || s.is247;
    else if (activeFilter !== "all") matchFilter = s.space_type === activeFilter || s.spaceType === activeFilter;
    return matchQuery && matchFilter;
  });

  const FILTERS = [
    { key: "all", label: "All" }, { key: "garage", label: "Garage" }, { key: "lot", label: "Lot" },
    { key: "driveway", label: "Driveway" }, { key: "street", label: "Street" },
    { key: "covered", label: "Covered" }, { key: "ev", label: "EV" }, { key: "24_7", label: "24/7" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <header style={{ padding: "1rem 2rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)", textDecoration: "none" }}>PARKme Ethiopia</Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/search" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>Search</Link>
          <Link href="/host" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Host</Link>
          <Link href="/auth/login" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>Sign In</Link>
        </nav>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parking by name or address..."
            style={{ flex: 1, padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }}
          />
          <button onClick={loadSpaces} style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: "600", cursor: "pointer" }}>
            Search
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{ padding: "0.5rem 1rem", borderRadius: "999px", border: `1px solid ${activeFilter === f.key ? "var(--primary)" : "var(--border)"}`, background: activeFilter === f.key ? "var(--primary)" : "white", color: activeFilter === f.key ? "white" : "var(--foreground)", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.875rem" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700" }}>{filtered.length} parking spaces nearby</h2>
          <Link href="/map" style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>View on Map</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Loading parking spaces...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: "600", color: "var(--primary)" }}>No parking spaces found</p>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {filtered.map((space) => {
              const price = space.pricing?.[0] || space.pricing?.[0];
              const rateLabel = price?.rate_type === "hourly" ? "hr" : price?.rate_type === "daily" ? "day" : "mo";
              return (
                <Link key={space.id} href={`/space/${space.id}`} style={{ background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", textDecoration: "none", color: "inherit", transition: "box-shadow 0.2s" }}>
                  <div style={{ height: "160px", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {space.primary_photo ? (
                      <img src={space.primary_photo} alt={space.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "2rem", color: "var(--muted-foreground)" }}>🅿</span>
                    )}
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                      <span style={{ padding: "0.125rem 0.5rem", background: "#EEF4FF", color: "var(--accent)", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", textTransform: "capitalize" }}>
                        {space.space_type || space.spaceType}
                      </span>
                      {space.rating_avg ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: "600" }}>★ {Number(space.rating_avg).toFixed(1)}</span>
                      ) : null}
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "0.25rem" }}>{space.name}</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>{space.address}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: "800" }}>ETB {price?.price || "—"}/{rateLabel}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{space.available_spots || space.availableSpots}/{space.total_spots || space.totalSpots} spots</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      {(space.is_covered || space.isCovered) && <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>☂ Covered</span>}
                      {(space.is_ev_charger || space.isEvCharger) && <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>⚡ EV</span>}
                      {(space.is_24_7 || space.is247) && <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>🕐 24/7</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
