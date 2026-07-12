"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function NearbySearchPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"distance" | "price" | "rating">("distance");

  useEffect(() => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => {
          setUserLocation({ lat: 9.0054, lng: 38.7636 });
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation({ lat: 9.0054, lng: 38.7636 });
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) loadSpaces();
  }, [userLocation]);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parking?lat=${userLocation?.lat || 9.0054}&lng=${userLocation?.lng || 38.7636}&radius=50`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch {
      setSpaces([]);
    }
    setLoading(false);
  };

  const enriched = spaces.map((s) => ({
    ...s,
    _distance: userLocation ? haversineDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude) : null,
  }));

  const filtered = enriched
    .filter((s) => {
      const matchQuery = !query || s.name?.toLowerCase().includes(query.toLowerCase()) || s.address?.toLowerCase().includes(query.toLowerCase());
      let matchFilter = true;
      if (activeFilter === "covered") matchFilter = s.isCovered;
      else if (activeFilter === "ev") matchFilter = s.isEvCharger;
      else if (activeFilter === "24_7") matchFilter = s.is247;
      else if (activeFilter !== "all") matchFilter = s.spaceType?.toLowerCase() === activeFilter;
      return matchQuery && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return (a._distance ?? 999) - (b._distance ?? 999);
      if (sortBy === "price") return (a.pricing?.[0]?.price || 999) - (b.pricing?.[0]?.price || 999);
      if (sortBy === "rating") return (b.ratingAvg || 0) - (a.ratingAvg || 0);
      return 0;
    });

  const FILTERS = [
    { key: "all", label: "All", icon: "" },
    { key: "garage", label: "Garage", icon: "🏢" },
    { key: "lot", label: "Lot", icon: "🅿" },
    { key: "driveway", label: "Driveway", icon: "🏠" },
    { key: "street", label: "Street", icon: "🛣" },
    { key: "covered", label: "Covered", icon: "☂" },
    { key: "24_7", label: "24/7", icon: "🕐" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "white", borderBottom: "1px solid #e5e7eb", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/" style={{ padding: "0.35rem 0.55rem", background: "#f3f4f6", borderRadius: 8, fontSize: "1rem", textDecoration: "none", color: "#1B1B1B" }}>←</Link>
        <span style={{ fontSize: "1rem", fontWeight: "700", flex: 1 }}>🅿 Find Parking</span>
        <Link href="/map" style={{ padding: "0.35rem 0.7rem", background: "#4A90D9", color: "white", borderRadius: 8, fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>🗺 Map</Link>
      </header>

      <div style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address..."
            style={{ flex: 1, padding: "0.65rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 10, fontSize: "0.9rem", outline: "none", background: "white" }}
          />
          <button onClick={loadSpaces} style={{ padding: "0.65rem 0.85rem", background: "#1B1B1B", color: "white", border: "none", borderRadius: 10, fontWeight: "600", fontSize: "0.9rem", cursor: "pointer" }}>🔍</button>
        </div>

        {locating && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#EEF4FF", borderRadius: 10, marginBottom: "0.6rem", fontSize: "0.8rem", color: "#4A90D9", fontWeight: "500" }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>📍</span> Getting your location...
          </div>
        )}

        <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", WebkitOverflowScrolling: "touch" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: 999,
                border: `1.5px solid ${activeFilter === f.key ? "#1B1B1B" : "#e5e7eb"}`,
                background: activeFilter === f.key ? "#1B1B1B" : "white",
                color: activeFilter === f.key ? "white" : "#374151",
                fontWeight: "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: "0.75rem",
                flexShrink: 0,
              }}
            >
              {f.icon ? `${f.icon} ` : ""}{f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "500" }}>
            {loading ? "Searching..." : `${filtered.length} space${filtered.length !== 1 ? "s" : ""} nearby`}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: "0.3rem 0.5rem", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.75rem", outline: "none", background: "white", cursor: "pointer" }}
          >
            <option value="distance">Nearest First</option>
            <option value="price">Lowest Price</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {filtered.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", background: "white", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🅿</div>
            <p style={{ fontWeight: "700", marginBottom: "0.25rem", fontSize: "1rem" }}>No parking found</p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Try a different search or filter</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {filtered.map((space) => {
              const price = space.pricing?.[0];
              const rateLabel = price?.rateType === "HOURLY" ? "hr" : price?.rateType === "DAILY" ? "day" : "mo";
              return (
                <Link
                  key={space.id}
                  href={`/space/${space.id}`}
                  style={{
                    display: "flex",
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    gap: "0.75rem",
                    textDecoration: "none",
                    color: "inherit",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ width: "90px", minHeight: "90px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {space.images?.[0]?.url ? (
                      <img src={space.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "1.8rem" }}>🅿</span>
                    )}
                  </div>
                  <div style={{ flex: 1, padding: "0.6rem 0.75rem 0.6rem 0", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.15rem" }}>
                      <span style={{ padding: "0.1rem 0.4rem", background: "#EEF4FF", color: "#4A90D9", borderRadius: 999, fontSize: "0.6rem", fontWeight: "600", textTransform: "capitalize" }}>
                        {space.spaceType || "Lot"}
                      </span>
                      {space.ratingAvg > 0 && (
                        <span style={{ fontSize: "0.65rem", fontWeight: "600", color: "#f59e0b" }}>★ {Number(space.ratingAvg).toFixed(1)}</span>
                      )}
                      {space.is247 && <span style={{ fontSize: "0.6rem", padding: "1px 5px", background: "#fef3c7", borderRadius: 999, color: "#d97706", fontWeight: 600 }}>24/7</span>}
                    </div>
                    <h3 style={{ fontSize: "0.85rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.1rem", color: "#111827" }}>{space.name}</h3>
                    <p style={{ fontSize: "0.7rem", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.25rem" }}>{space.address}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#1B1B1B" }}>
                        {price ? `ETB ${price.price}` : "—"}<span style={{ fontSize: "0.65rem", fontWeight: "500", color: "#9ca3af" }}>/{rateLabel}</span>
                      </span>
                      {space._distance !== null && (
                        <span style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: "500" }}>
                          📍 {space._distance < 1 ? `${Math.round(space._distance * 1000)}m` : `${space._distance.toFixed(1)}km`}
                        </span>
                      )}
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
