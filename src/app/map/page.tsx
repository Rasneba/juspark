"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => (
  <div style={{ width: "100%", height: "100%", background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "0.9rem" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗺</div>
      <div>Loading map...</div>
    </div>
  </div>
) });

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [myLocating, setMyLocating] = useState(false);
  const fetchingRef = useRef(false);

  const fetchSpaces = useCallback(async (lat: number, lng: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/parking?lat=${lat}&lng=${lng}&radius=100`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch {
      setSpaces([]);
    }
    setLoading(false);
    fetchingRef.current = false;
  }, []);

  useEffect(() => {
    fetchSpaces(mapCenter[0], mapCenter[1]);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Addis Ababa, Ethiopia")}&limit=1`);
      const geoData = await geoRes.json();
      if (geoData?.[0]) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        setMapCenter([lat, lng]);
        setShowSearchArea(false);
        setTimeout(() => fetchSpaces(lat, lng), 800);
      }
    } catch {}
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setMyLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setShowSearchArea(false);
        setMyLocating(false);
        if ((window as any).__leafletMapView) {
          (window as any).__leafletMapView.showMyLocation(lat, lng);
        }
        fetchSpaces(lat, lng);
      },
      () => {
        setMyLocating(false);
        alert("Unable to get your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const spaceIcon = (type: string) => {
    if (!type) return "🅿";
    const t = type.toLowerCase();
    if (t === "garage") return "🏢";
    if (t === "driveway") return "🏠";
    if (t === "street") return "🛣";
    return "🅿";
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ padding: "0.5rem 0.75rem", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 30, flexShrink: 0 }}>
        <Link href="/search" style={{ padding: "0.4rem 0.6rem", background: "#f3f4f6", borderRadius: 8, fontSize: "1.1rem", textDecoration: "none" }}>←</Link>
        <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>🗺 Map</span>
        <span style={{ flex: 1 }} />
        <Link href="/auth/login" style={{ padding: "0.35rem 0.7rem", background: "#1B1B1B", color: "white", borderRadius: 8, fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>Sign In</Link>
      </header>

      <form onSubmit={handleSearch} style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.5rem 0.75rem", display: "flex", gap: "0.35rem", zIndex: 20, flexShrink: 0 }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search parking in Addis Ababa..."
          style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.9rem", outline: "none" }} />
        <button type="submit" style={{ padding: "0.6rem 1rem", background: "#1B1B1B", color: "white", border: "none", borderRadius: 8, fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}>🔍</button>
      </form>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <MapView
          center={mapCenter}
          spaces={spaces}
          selectedId={selectedSpace?.id || null}
          onCenterChange={(lat: number, lng: number) => {
            setMapCenter([lat, lng]);
            setShowSearchArea(true);
          }}
          onSelectSpace={setSelectedSpace}
        />

        {showSearchArea && (
          <button onClick={() => { fetchSpaces(mapCenter[0], mapCenter[1]); setShowSearchArea(false); }}
            style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", color: "#1B1B1B", border: "1px solid #d1d5db", borderRadius: 999, padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            🔍 Search this area
          </button>
        )}

        <button onClick={handleMyLocation} disabled={myLocating}
          style={{ position: "absolute", bottom: 70, right: 12, zIndex: 1000, width: 44, height: 44, borderRadius: "50%", border: "1px solid #d1d5db", background: myLocating ? "#f5f5f5" : "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: myLocating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: myLocating ? 0.7 : 1 }}>
          {myLocating ? "⏳" : "📍"}
        </button>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e5e7eb", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1000 }}>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {loading ? "Searching..." : <><strong style={{ color: "#1B1B1B" }}>{spaces.length}</strong> spots nearby</>}
          </span>
          <Link href="/search" style={{ padding: "0.4rem 0.75rem", background: "#4A90D9", color: "white", borderRadius: 8, fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>List View</Link>
        </div>

        {selectedSpace && (
          <div style={{ position: "absolute", bottom: 52, left: 8, right: 8, zIndex: 9999, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "0.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                {spaceIcon(selectedSpace.spaceType || selectedSpace.space_type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", fontSize: "0.9rem", marginBottom: 2 }}>{selectedSpace.name}</div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: 4 }}>{selectedSpace.address}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#1B1B1B" }}>
                    {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}` : "TBD"}
                    <span style={{ fontSize: "0.7rem", fontWeight: "500", color: "#6b7280" }}>
                      {selectedSpace.pricing?.[0] ? `/${selectedSpace.pricing[0].rateType === "HOURLY" ? "hr" : selectedSpace.pricing[0].rateType === "DAILY" ? "day" : "mo"}` : ""}
                    </span>
                  </span>
                  {(selectedSpace.ratingAvg || selectedSpace.rating_avg) > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600 }}>★ {Number(selectedSpace.ratingAvg || selectedSpace.rating_avg).toFixed(1)}</span>
                  )}
                  <span style={{ fontSize: "0.6rem", padding: "1px 6px", background: "#f3f4f6", borderRadius: 999, color: "#6b7280", fontWeight: 600, textTransform: "capitalize" }}>
                    {selectedSpace.spaceType || selectedSpace.space_type}
                  </span>
                  {(selectedSpace.isCovered || selectedSpace.is_covered) && <span style={{ fontSize: "0.6rem", padding: "1px 6px", background: "#dbeafe", borderRadius: 999, color: "#2563eb", fontWeight: 600 }}>Covered</span>}
                  {(selectedSpace.is247 || selectedSpace.is_24_7) && <span style={{ fontSize: "0.6rem", padding: "1px 6px", background: "#fef3c7", borderRadius: 999, color: "#d97706", fontWeight: 600 }}>24/7</span>}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setSelectedSpace(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#9ca3af", padding: "4px", flexShrink: 0 }}>✕</button>
            </div>
            <Link href={`/space/${selectedSpace.id}`} style={{ display: "block", marginTop: "0.6rem", padding: "0.6rem", background: "#1B1B1B", color: "white", borderRadius: 10, fontSize: "0.85rem", fontWeight: "600", textAlign: "center", textDecoration: "none" }}>
              View Details & Book →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
