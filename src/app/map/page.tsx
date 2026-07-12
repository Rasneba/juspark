"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "0.9rem" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗺</div>
        <div>Loading map...</div>
      </div>
    </div>
  ),
});

interface PoiItem {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: string;
}

const POI_CATEGORIES = [
  { key: "parking", label: "Parking", emoji: "🅿", overpass: '["amenity"="parking"]' },
  { key: "hotel", label: "Hotels", emoji: "🏨", overpass: '["tourism"="hotel"]' },
  { key: "mall", label: "Malls", emoji: "🛍", overpass: '["shop"="mall"]' },
  { key: "airport", label: "Airport", emoji: "✈️", overpass: '["aeroway"="aerodrome"]' },
  { key: "restaurant", label: "Food", emoji: "🍽", overpass: '["amenity"~"restaurant|cafe|fast_food"]' },
  { key: "hospital", label: "Hospital", emoji: "🏥", overpass: '["amenity"="hospital"]' },
  { key: "bank", label: "Banks", emoji: "🏦", overpass: '["amenity"="bank"]' },
  { key: "fuel", label: "Fuel", emoji: "⛽", overpass: '["amenity"="fuel"]' },
  { key: "school", label: "Schools", emoji: "🏫", overpass: '["amenity"~"school|university|college"]' },
];

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [pois, setPois] = useState<PoiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [myLocating, setMyLocating] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [satellite, setSatellite] = useState(false);
  const [showPois, setShowPois] = useState(true);
  const [activePoiCategories, setActivePoiCategories] = useState<Set<string>>(new Set(["hotel", "mall", "airport"]));
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const fetchingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const fetchPois = useCallback(async (lat: number, lng: number) => {
    const radius = 2000;
    const queries = POI_CATEGORIES.filter((c) => activePoiCategories.has(c.key));
    if (queries.length === 0) { setPois([]); return; }

    const allPois: PoiItem[] = [];
    for (const cat of queries) {
      try {
        const q = `[out:json][timeout:8];(
          node${cat.overpass}(around:${radius},${lat},${lng});
          way${cat.overpass}(around:${radius},${lat},${lng});
        );out center body;`;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `data=${encodeURIComponent(q)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (!res.ok) continue;
        const data = await res.json();
        for (const el of (data.elements || []).slice(0, 20)) {
          const eLat = el.lat || el.center?.lat;
          const eLng = el.lon || el.center?.lon;
          if (!eLat || !eLng) continue;
          allPois.push({
            id: `${cat.key}-${el.id}`,
            lat: eLat,
            lng: eLng,
            name: el.tags?.name || el.tags?.["name:en"] || cat.label,
            type: cat.key,
          });
        }
      } catch {}
    }
    setPois(allPois);
  }, [activePoiCategories]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(",");
        setCurrentAddress(parts.slice(0, 3).join(",").trim());
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSpaces(mapCenter[0], mapCenter[1]);
    reverseGeocode(mapCenter[0], mapCenter[1]);
    handleMyLocation();
  }, []);

  useEffect(() => {
    if (showPois && activePoiCategories.size > 0) {
      fetchPois(mapCenter[0], mapCenter[1]);
    }
  }, [activePoiCategories, showPois]);

  const handleSearchInputChange = (value: string) => {
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length < 2) { setSearchSuggestions([]); setShowSuggestions(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ", Addis Ababa, Ethiopia")}&limit=6&addressdetails=1`);
        const data = await res.json();
        setSearchSuggestions(data || []);
        setShowSuggestions(data?.length > 0);
      } catch {}
    }, 300);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setMapCenter([lat, lng]);
    setSearchResult({ lat, lng, name: suggestion.display_name?.split(",")[0] || suggestion.display_name });
    setShowSuggestions(false);
    setQuery(suggestion.display_name?.split(",")[0] || "");
    reverseGeocode(lat, lng);
    fetchSpaces(lat, lng);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSuggestions.length > 0) {
      handleSuggestionClick(searchSuggestions[0]);
      return;
    }
    handleSearchInputChange(query);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setMyLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setShowSearchArea(false);
        setMyLocating(false);
        reverseGeocode(lat, lng);
        if ((window as any).__leafletMapView) {
          (window as any).__leafletMapView.showMyLocation(lat, lng);
        }
        fetchSpaces(lat, lng);
      },
      () => {
        setMyLocating(false);
        setCurrentAddress("Addis Ababa, Ethiopia");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const togglePoiCategory = (key: string) => {
    setActivePoiCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const spaceIcon = (type: string) => {
    if (!type) return "🅿";
    const t = type.toLowerCase();
    if (t === "garage") return "🏢";
    if (t === "driveway") return "🏠";
    if (t === "street") return "🛣";
    return "🅿";
  };

  const getPhotoUrl = (space: any) => {
    if (space.images?.[0]?.url) return space.images[0].url;
    return null;
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ padding: "0.5rem 0.75rem", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 40, flexShrink: 0 }}>
        <Link href="/search" style={{ padding: "0.4rem 0.6rem", background: "#f3f4f6", borderRadius: 8, fontSize: "1.1rem", textDecoration: "none" }}>←</Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>🗺 Map</span>
          {currentAddress && (
            <div style={{ fontSize: "0.65rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {currentAddress}</div>
          )}
        </div>
        <button
          onClick={() => setSatellite(!satellite)}
          style={{ padding: "0.3rem 0.6rem", borderRadius: 8, border: `1px solid ${satellite ? "#4A90D9" : "#d1d5db"}`, background: satellite ? "#EEF4FF" : "white", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer", color: satellite ? "#4A90D9" : "#374151" }}
        >
          {satellite ? "🛰 Satellite" : "🗺 Streets"}
        </button>
        <Link href="/auth/login" style={{ padding: "0.35rem 0.7rem", background: "#1B1B1B", color: "white", borderRadius: 8, fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>Sign In</Link>
      </header>

      <div style={{ position: "relative", zIndex: 30, background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.5rem 0.75rem", flexShrink: 0 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.35rem" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search places, hotels, airports, streets..."
            style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", outline: "none" }}
          />
          <button type="submit" style={{ padding: "0.6rem 0.85rem", background: "#1B1B1B", color: "white", border: "none", borderRadius: 8, fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}>🔍</button>
        </form>

        {showSuggestions && searchSuggestions.length > 0 && (
          <div style={{ position: "absolute", left: "0.75rem", right: "0.75rem", top: "3.4rem", background: "white", borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 100, maxHeight: "240px", overflowY: "auto" }}>
            {searchSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                style={{ display: "block", width: "100%", padding: "0.6rem 0.75rem", textAlign: "left", border: "none", borderBottom: i < searchSuggestions.length - 1 ? "1px solid #f3f4f6" : "none", background: "white", cursor: "pointer", fontSize: "0.8rem", color: "#374151" }}
              >
                <div style={{ fontWeight: "600", marginBottom: 2 }}>📍 {s.display_name?.split(",")[0]}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "0.35rem 0.75rem", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "0.3rem", overflowX: "auto", flexShrink: 0, WebkitOverflowScrolling: "touch" }}>
        <button
          onClick={() => setShowPois(!showPois)}
          style={{ padding: "0.25rem 0.55rem", borderRadius: 999, border: `1.5px solid ${showPois ? "#059669" : "#e5e7eb"}`, background: showPois ? "#D5F5E3" : "white", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, color: showPois ? "#059669" : "#6b7280" }}
        >
          📍 Places {showPois ? "ON" : "OFF"}
        </button>
        {POI_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => togglePoiCategory(cat.key)}
            style={{ padding: "0.25rem 0.55rem", borderRadius: 999, border: `1.5px solid ${activePoiCategories.has(cat.key) ? "#1B1B1B" : "#e5e7eb"}`, background: activePoiCategories.has(cat.key) ? "#1B1B1B" : "white", color: activePoiCategories.has(cat.key) ? "white" : "#6b7280", fontSize: "0.7rem", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <MapView
          center={mapCenter}
          spaces={spaces}
          pois={pois}
          selectedId={selectedSpace?.id || null}
          satellite={satellite}
          showPois={showPois}
          searchResult={searchResult}
          onCenterChange={(lat: number, lng: number) => {
            setMapCenter([lat, lng]);
            setShowSearchArea(true);
          }}
          onSelectSpace={setSelectedSpace}
        />

        {showSearchArea && (
          <button onClick={() => { fetchSpaces(mapCenter[0], mapCenter[1]); fetchPois(mapCenter[0], mapCenter[1]); setShowSearchArea(false); }}
            style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "white", color: "#1B1B1B", border: "1px solid #d1d5db", borderRadius: 999, padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            🔍 Search this area
          </button>
        )}

        <button onClick={handleMyLocation} disabled={myLocating}
          style={{ position: "absolute", bottom: 70, right: 12, zIndex: 9999, width: 44, height: 44, borderRadius: "50%", border: "1px solid #d1d5db", background: myLocating ? "#f5f5f5" : "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: myLocating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: myLocating ? 0.7 : 1 }}>
          {myLocating ? "⏳" : "📍"}
        </button>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e5e7eb", padding: "0.6rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 9999 }}>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {loading ? "Searching..." : <><strong style={{ color: "#1B1B1B" }}>{spaces.length}</strong> parking · {pois.length} places nearby</>}
          </span>
          <Link href="/search" style={{ padding: "0.4rem 0.75rem", background: "#4A90D9", color: "white", borderRadius: 8, fontSize: "0.75rem", fontWeight: "600", textDecoration: "none" }}>List</Link>
        </div>

        {selectedSpace && (
          <div style={{ position: "absolute", bottom: 52, left: 8, right: 8, zIndex: 9999, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            {getPhotoUrl(selectedSpace) && (
              <div style={{ width: "100%", height: "140px", position: "relative" }}>
                <img src={getPhotoUrl(selectedSpace)!} alt={selectedSpace.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "0.75rem 0.75rem 0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                    {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}` : "TBD"}
                    <span style={{ fontSize: "0.7rem", fontWeight: "500", opacity: 0.9 }}>
                      {selectedSpace.pricing?.[0] ? `/${selectedSpace.pricing[0].rateType === "HOURLY" ? "hr" : selectedSpace.pricing[0].rateType === "DAILY" ? "day" : "mo"}` : ""}
                    </span>
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedSpace(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "white", padding: "4px 8px", borderRadius: 6 }}>✕</button>
              </div>
            )}
            <div style={{ padding: "0.6rem 0.75rem" }}>
              {!getPhotoUrl(selectedSpace) && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{spaceIcon(selectedSpace.spaceType)}</span>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{selectedSpace.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{selectedSpace.address}</div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedSpace(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#9ca3af", padding: "4px" }}>✕</button>
                </div>
              )}
            </div>
            <div style={{ padding: "0 0.75rem 0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#1B1B1B" }}>
                  {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}` : "TBD"}
                  <span style={{ fontSize: "0.7rem", fontWeight: "500", color: "#6b7280" }}>
                    {selectedSpace.pricing?.[0] ? `/${selectedSpace.pricing[0].rateType === "HOURLY" ? "hr" : selectedSpace.pricing[0].rateType === "DAILY" ? "day" : "mo"}` : ""}
                  </span>
                </span>
                {selectedSpace.ratingAvg > 0 && (
                  <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600 }}>★ {Number(selectedSpace.ratingAvg).toFixed(1)}</span>
                )}
                <span style={{ fontSize: "0.6rem", padding: "1px 6px", background: "#f3f4f6", borderRadius: 999, color: "#6b7280", fontWeight: 600, textTransform: "capitalize" }}>{selectedSpace.spaceType}</span>
                {selectedSpace.isCovered && <span style={{ fontSize: "0.6rem", padding: "1px 6px", background: "#dbeafe", borderRadius: 999, color: "#2563eb", fontWeight: 600 }}>Covered</span>}
                {selectedSpace.is247 && <span style={{ fontSize: "0.6rem", padding: "1px 6px", background: "#fef3c7", borderRadius: 999, color: "#d97706", fontWeight: 600 }}>24/7</span>}
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <Link href={`/space/${selectedSpace.id}`} style={{ flex: 1, display: "block", padding: "0.55rem", background: "#1B1B1B", color: "white", borderRadius: 8, fontSize: "0.8rem", fontWeight: "600", textAlign: "center", textDecoration: "none" }}>
                  Details & Book →
                </Link>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpace.latitude},${selectedSpace.longitude}`} target="_blank" rel="noopener" style={{ padding: "0.55rem 0.75rem", background: "#4A90D9", color: "white", borderRadius: 8, fontSize: "0.8rem", fontWeight: "600", textDecoration: "none" }}>
                  🧭
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
