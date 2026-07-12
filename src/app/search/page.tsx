"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

  useEffect(() => { if (userLocation) loadSpaces(); }, [userLocation]);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parking?lat=${userLocation?.lat || 9.0054}&lng=${userLocation?.lng || 38.7636}&radius=10`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch {}
    setLoading(false);
  };

  const filtered = spaces.filter((s) => {
    const matchQuery = !query || s.name?.toLowerCase().includes(query.toLowerCase()) || s.address?.toLowerCase().includes(query.toLowerCase());
    let matchFilter = true;
    if (activeFilter === "covered") matchFilter = s.is_covered || s.isCovered;
    else if (activeFilter === "ev") matchFilter = s.is_ev_charger || s.isEvCharger;
    else if (activeFilter === "24_7") matchFilter = s.is_24_7 || s.is247;
    else if (activeFilter !== "all") matchFilter = (s.space_type || s.spaceType)?.toLowerCase() === activeFilter;
    return matchQuery && matchFilter;
  });

  const FILTERS = [
    { key: "all", label: "All" }, { key: "garage", label: "Garage" }, { key: "lot", label: "Lot" },
    { key: "driveway", label: "Driveway" }, { key: "covered", label: "Covered" }, { key: "ev", label: "EV" }, { key: "24_7", label: "24/7" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, padding: "0.75rem 1rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/" style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600" }}>← Home</Link>
        <span style={{ flex: 1 }} />
        <Link href="/map" style={{ padding: "0.4rem 0.75rem", background: "var(--accent)", color: "white", borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: "600" }}>🗺 Map</Link>
        <Link href="/auth/login" style={{ padding: "0.4rem 0.75rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: "600" }}>Sign In</Link>
      </header>

      <div style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search parking..."
            style={{ flex: 1, padding: "0.7rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "0.95rem", outline: "none", background: "white" }} />
          <button onClick={loadSpaces} style={{ padding: "0.7rem 1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: "600", fontSize: "0.9rem" }}>🔍</button>
        </div>

        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.75rem", overflowX: "auto", paddingBottom: "0.25rem", WebkitOverflowScrolling: "touch" }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{ padding: "0.4rem 0.75rem", borderRadius: "999px", border: `1.5px solid ${activeFilter === f.key ? "var(--primary)" : "var(--border)"}`, background: activeFilter === f.key ? "var(--primary)" : "white", color: activeFilter === f.key ? "white" : "var(--foreground)", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.8rem", flexShrink: 0 }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "0.75rem", fontWeight: "600" }}>
          {loading ? "Loading..." : `${filtered.length} spaces nearby`}
        </div>

        {filtered.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🅿</div>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No parking found</p>
            <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>Try a different search or filter</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((space) => {
              const price = space.pricing?.[0];
              const rateLabel = price?.rate_type === "hourly" || price?.rateType === "HOURLY" ? "hr" : "day";
              return (
                <Link key={space.id} href={`/space/${space.id}`}
                  style={{ display: "flex", background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", gap: "0.75rem" }}>
                  <div style={{ width: "100px", minHeight: "100px", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {space.primary_photo ? (
                      <img src={space.primary_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : <span style={{ fontSize: "1.5rem" }}>🅿</span>}
                  </div>
                  <div style={{ flex: 1, padding: "0.6rem 0.75rem 0.6rem 0", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.2rem" }}>
                      <span style={{ padding: "0.1rem 0.4rem", background: "#EEF4FF", color: "var(--accent)", borderRadius: "999px", fontSize: "0.65rem", fontWeight: "600", textTransform: "capitalize" }}>
                        {space.space_type || space.spaceType}
                      </span>
                      {space.rating_avg ? <span style={{ fontSize: "0.7rem", fontWeight: "600" }}>★ {Number(space.rating_avg).toFixed(1)}</span> : null}
                    </div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{space.name}</h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{space.address}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: "800" }}>ETB {price?.price || "—"}/{rateLabel}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{space.available_spots || space.availableSpots}/{space.total_spots || space.totalSpots}</span>
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
