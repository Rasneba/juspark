"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";
const IPSTACK_KEY = "c3dd8bd2d9394afbd88017c9d5091fcc";

const DEFAULT_CENTER: [number, number] = [9.0054, 38.7636];

function getLat(s: any): number { return s.latitude || s.lat || 9.0054; }
function getLng(s: any): number { return s.longitude || s.lng || 38.7636; }

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);

  const fetchSpaces = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/juspark/spaces?lat=${lat}&lng=${lng}&radius=10`);
      const data = await res.json();
      setSpaces(Array.isArray(data) ? data : []);
    } catch {
      setSpaces([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSpaces(mapCenter[0], mapCenter[1]);
  }, [mapCenter, fetchSpaces]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await fetch(`http://api.ipstack.com/check?access_key=${IPSTACK_KEY}&fields=latitude,longitude`);
    } catch {}
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Addis Ababa, Ethiopia")}&limit=1`);
      const geoData = await geoRes.json();
      if (geoData?.[0]) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        setMapCenter([lat, lng]);
        setShowSearchArea(false);
      }
    } catch {}
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(center);
        setShowSearchArea(false);
      },
      () => {}
    );
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "0.5rem 0.75rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 30, flexShrink: 0 }}>
        <Link href="/search" style={{ padding: "0.4rem 0.6rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "1.1rem" }}>←</Link>
        <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>🗺 Map</span>
        <span style={{ flex: 1 }} />
        <Link href="/auth/login" style={{ padding: "0.35rem 0.7rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600" }}>Sign In</Link>
      </header>

      <form onSubmit={handleSearch} style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "0.5rem 0.75rem", display: "flex", gap: "0.35rem", zIndex: 20, flexShrink: 0 }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search location..."
          style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "0.9rem", outline: "none" }} />
        <button type="submit" style={{ padding: "0.6rem 1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: "600", fontSize: "0.85rem" }}>🔍</button>
      </form>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <MapView
          center={mapCenter}
          spaces={spaces}
          onCenterChange={(lat: number, lng: number) => {
            setMapCenter([lat, lng]);
            setShowSearchArea(true);
          }}
          onSelectSpace={setSelectedSpace}
        />

        {showSearchArea && (
          <button onClick={() => { fetchSpaces(mapCenter[0], mapCenter[1]); setShowSearchArea(false); }}
            style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", color: "var(--primary)", border: "1px solid var(--border)", borderRadius: "999px", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            Search this area
          </button>
        )}

        <button onClick={handleMyLocation}
          style={{ position: "absolute", bottom: 60, right: 12, zIndex: 1000, width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border)", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          &#9737;
        </button>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid var(--border)", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1000 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
            {loading ? "Loading..." : <><strong style={{ color: "var(--primary)" }}>{spaces.length}</strong> spaces</>}
          </span>
          <Link href="/search" style={{ padding: "0.4rem 0.75rem", background: "var(--accent)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600" }}>List View</Link>
        </div>

        {selectedSpace && (
          <div style={{ position: "absolute", bottom: 50, left: 8, right: 8, zIndex: 1000, background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: "700", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSpace.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSpace.address}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary)", marginTop: "0.2rem" }}>
                {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}/${selectedSpace.pricing[0].rate_type === "hourly" ? "hr" : "day"}` : "Price TBD"}
              </div>
            </div>
            <Link href={`/space/${selectedSpace.id}`} style={{ padding: "0.5rem 0.75rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap" }}>View</Link>
            <button onClick={() => setSelectedSpace(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--muted-foreground)", padding: "0.25rem" }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
