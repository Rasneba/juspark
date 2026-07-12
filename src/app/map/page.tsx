"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

function getLat(s: any): number { return s.latitude || s.lat || 9.0054; }
function getLng(s: any): number { return s.longitude || s.lng || 38.7636; }

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div style={{ width: "100%", height: "100%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>Loading map...</div> });

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
      const res = await fetch(`${API}/api/juspark/spaces?lat=${lat}&lng=${lng}&radius=100`);
      const data = await res.json();
      setSpaces(Array.isArray(data) ? data : []);
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
        setTimeout(() => fetchSpaces(lat, lng), 1000);
      }
    } catch {}
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    setMyLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const center: [number, number] = [lat, lng];
        setMapCenter(center);
        setShowSearchArea(false);
        setMyLocating(false);
        if ((window as any).__leafletMapView) {
          (window as any).__leafletMapView.showMyLocation(lat, lng);
        }
        fetchSpaces(lat, lng);
      },
      (err) => {
        setMyLocating(false);
        alert("Unable to get your location. Please check your browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleIdle = useCallback(() => {
    setShowSearchArea(true);
  }, []);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ padding: "0.5rem 0.75rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 30, flexShrink: 0 }}>
        <Link href="/search" style={{ padding: "0.4rem 0.6rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "1.1rem", textDecoration: "none" }}>←</Link>
        <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>🗺 Map</span>
        <span style={{ flex: 1 }} />
        <Link href="/auth/login" style={{ padding: "0.35rem 0.7rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>Sign In</Link>
      </header>

      <form onSubmit={handleSearch} style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "0.5rem 0.75rem", display: "flex", gap: "0.35rem", zIndex: 20, flexShrink: 0 }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search location in Addis Ababa..."
          style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "0.9rem", outline: "none" }} />
        <button type="submit" style={{ padding: "0.6rem 1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: "600", fontSize: "0.85rem" }}>🔍</button>
      </form>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <MapView
          center={mapCenter}
          spaces={spaces}
          onCenterChange={(lat, lng) => {
            setMapCenter([lat, lng]);
            handleIdle();
          }}
          onSelectSpace={setSelectedSpace}
        />

        {showSearchArea && !loading && (
          <button onClick={() => { fetchSpaces(mapCenter[0], mapCenter[1]); setShowSearchArea(false); }}
            style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", color: "var(--primary)", border: "1px solid var(--border)", borderRadius: "999px", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            Search this area
          </button>
        )}

        <button onClick={handleMyLocation} disabled={myLocating}
          style={{ position: "absolute", bottom: 70, right: 12, zIndex: 1000, width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border)", background: myLocating ? "#f5f5f5" : "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: myLocating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: myLocating ? 0.7 : 1 }}>
          {myLocating ? "⏳" : "📍"}
        </button>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid var(--border)", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1000 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
            {loading ? "Searching..." : <><strong style={{ color: "var(--primary)" }}>{spaces.length}</strong> parking spots nearby</>}
          </span>
          <Link href="/search" style={{ padding: "0.4rem 0.75rem", background: "var(--accent)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>List</Link>
        </div>

        {selectedSpace && (
          <div style={{ position: "absolute", bottom: 52, left: 8, right: 8, zIndex: 1000, background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "0.75rem", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                {selectedSpace.is_covered || selectedSpace.isCovered ? "☂" : selectedSpace.space_type === "garage" ? "🏢" : "🅿"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSpace.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSpace.address}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary)" }}>
                    {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}/${selectedSpace.pricing[0].rate_type === "hourly" ? "hr" : selectedSpace.pricing[0].rate_type === "daily" ? "day" : "mo"}` : "Price TBD"}
                  </span>
                  {selectedSpace.rating_avg > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#666" }}>★ {Number(selectedSpace.rating_avg).toFixed(1)}</span>
                  )}
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "#EEF4FF", borderRadius: 999, color: "var(--accent)", fontWeight: 600 }}>
                    {selectedSpace.space_type}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedSpace(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "var(--muted-foreground)", padding: "0.25rem", flexShrink: 0 }}>✕</button>
            </div>
            <Link href={`/space/${selectedSpace.id}`} style={{ display: "block", marginTop: "0.6rem", padding: "0.55rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.85rem", fontWeight: "600", textAlign: "center", textDecoration: "none" }}>
              View Details & Book →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
