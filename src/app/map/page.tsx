"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7a72", fontSize: "0.9rem" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗺</div>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>Loading map...</div>
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
    if (t === "driveway") return "🏡";
    if (t === "street") return "🛣";
    return "🅿";
  };

  const getPhotoUrl = (space: any) => {
    if (space.images?.[0]?.url) return space.images[0].url;
    return null;
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header bar */}
      <header className="px-3 py-2.5 bg-white border-b border-zinc-200/80 flex items-center gap-2 z-40 flex-shrink-0 shadow-sm">
        <Link href="/search" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <span className="font-display font-bold text-sm text-zinc-950">🗺 Map</span>
          {currentAddress && (
            <div className="text-[10px] text-zinc-500 truncate">📍 {currentAddress}</div>
          )}
        </div>
        <button
          onClick={() => setSatellite(!satellite)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
            satellite
              ? "bg-[#128a42]/10 text-[#128a42] border-[#128a42]/30"
              : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          {satellite ? "🛰 Satellite" : "🗺 Streets"}
        </button>
        <Link href="/auth/login" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-xl text-[11px] font-bold transition-all">
          Sign In
        </Link>
      </header>

      {/* Search bar */}
      <div className="relative z-30 bg-white border-b border-zinc-200/80 px-3 py-2 flex-shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search places, hotels, airports, streets..."
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] transition-all"
          />
          <button type="submit" className="px-4 py-2.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl font-bold text-sm transition-all shadow-sm">
            🔍
          </button>
        </form>

        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute left-3 right-3 top-[3.6rem] bg-white rounded-2xl border border-zinc-200 shadow-2xl z-[100] max-h-60 overflow-y-auto">
            {searchSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
              >
                <div className="text-xs font-bold text-zinc-900 truncate">📍 {s.display_name?.split(",")[0]}</div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">{s.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POI category chips */}
      <div className="px-3 py-2 bg-white border-b border-zinc-200/80 flex gap-1.5 overflow-x-auto flex-shrink-0" style={{ WebkitOverflowScrolling: "touch" }}>
        <button
          onClick={() => setShowPois(!showPois)}
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
            showPois
              ? "bg-[#128a42]/10 text-[#128a42] border-[#128a42]/30"
              : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          📍 Places {showPois ? "ON" : "OFF"}
        </button>
        {POI_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => togglePoiCategory(cat.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
              activePoiCategories.has(cat.key)
                ? "bg-[#128a42] text-white border-[#128a42]"
                : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Map + overlays */}
      <div className="flex-1 relative min-h-0">
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
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[9999] bg-white text-[#128a42] border border-[#128a42]/30 rounded-full px-5 py-2 text-xs font-bold shadow-xl shadow-black/10 hover:bg-[#128a42]/5 transition-all active:scale-95"
          >
            🔍 Search this area
          </button>
        )}

        <button onClick={handleMyLocation} disabled={myLocating}
          className="absolute bottom-20 right-3 z-[9999] w-11 h-11 rounded-full bg-white border border-zinc-200 shadow-lg flex items-center justify-center text-lg hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
          style={{ touchAction: "manipulation" }}
        >
          {myLocating ? (
            <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" />
          ) : "📍"}
        </button>

        {/* Bottom status bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-zinc-200/80 px-3 py-2.5 flex items-center justify-between z-[9999]">
          <span className="text-xs text-zinc-500">
            {loading ? "Searching..." : (
              <><strong className="text-[#128a42]">{spaces.length}</strong> parking · {pois.length} places nearby</>
            )}
          </span>
          <Link href="/search" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-xl text-[11px] font-bold transition-all">
            List View
          </Link>
        </div>

        {/* Selected space card */}
        {selectedSpace && (
          <div className="absolute bottom-14 left-2 right-2 z-[9999] bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl">
            {getPhotoUrl(selectedSpace) && (
              <div className="w-full h-36 relative">
                <img src={getPhotoUrl(selectedSpace)!} alt={selectedSpace.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <span className="text-sm font-display font-extrabold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                    {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}` : "TBD"}
                    <span className="text-[11px] font-normal opacity-90">
                      {selectedSpace.pricing?.[0] ? `/${selectedSpace.pricing[0].rateType === "HOURLY" ? "hr" : selectedSpace.pricing[0].rateType === "DAILY" ? "day" : "mo"}` : ""}
                    </span>
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedSpace(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xs hover:bg-black/60 transition-all"
                >✕</button>
              </div>
            )}
            <div className="p-3">
              {!getPhotoUrl(selectedSpace) && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{spaceIcon(selectedSpace.spaceType)}</span>
                    <div>
                      <div className="font-display font-bold text-sm text-zinc-950">{selectedSpace.name}</div>
                      <div className="text-[10px] text-zinc-500">{selectedSpace.address}</div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedSpace(null); }}
                    className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-all"
                  >✕</button>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-display font-extrabold text-base text-[#128a42]">
                  {selectedSpace.pricing?.[0] ? `ETB ${selectedSpace.pricing[0].price}` : "TBD"}
                  <span className="text-[10px] font-normal text-zinc-500 font-sans">
                    {selectedSpace.pricing?.[0] ? `/${selectedSpace.pricing[0].rateType === "HOURLY" ? "hr" : selectedSpace.pricing[0].rateType === "DAILY" ? "day" : "mo"}` : ""}
                  </span>
                </span>
                {selectedSpace.ratingAvg > 0 && (
                  <span className="text-[11px] font-bold text-zinc-800"><span className="text-[#facc15]">★</span> {Number(selectedSpace.ratingAvg).toFixed(1)}</span>
                )}
                <span className="text-[9px] px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-600 font-bold uppercase">{selectedSpace.spaceType}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/space/${selectedSpace.id}`} className="flex-1 block py-2.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-xs font-bold text-center transition-all active:scale-[0.98]">
                  Details & Book →
                </Link>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpace.latitude},${selectedSpace.longitude}`} target="_blank" rel="noopener"
                  className="px-3 py-2.5 bg-[#128a42]/10 text-[#128a42] rounded-2xl text-xs font-bold hover:bg-[#128a42]/20 transition-all"
                >🧭</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
