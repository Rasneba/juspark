"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #d1fae5 0%, #ecfdf5 50%, #f0fdf4 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#065f46", fontSize: "0.9rem" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🅿</div>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700 }}>Finding parking near you...</div>
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSpace, setBookingSpace] = useState<any>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const fetchingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSpaces = useCallback(async (lat: number, lng: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await api.get(`/api/parking?lat=${lat}&lng=${lng}&radius=100`);
      if (!res.ok) throw new Error("Failed");
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

  const openBooking = (space: any) => {
    setBookingSpace(space);
    setShowBookingModal(true);
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Fixed Nav — ParkSky style */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-zinc-200 z-50">
        <div className="max-w-3xl mx-auto px-5 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#128a42] to-[#0f7a39] rounded-3xl flex items-center justify-center text-white text-2xl shadow-lg shadow-[#128a42]/20">🅿</div>
            <span className="font-display font-extrabold text-2xl tracking-tighter text-[#128a42]">Park<span className="text-zinc-900">Eth</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-3xl text-sm hover:bg-zinc-50 transition-all">
              👤 <span className="font-medium text-zinc-700">Sign In</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Full-screen Map */}
      <div className="absolute inset-0 top-[57px]">
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
      </div>

      {/* Floating Search — ParkSky style */}
      <div className="absolute top-[72px] left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[999]">
        <form onSubmit={handleSearchSubmit}>
          <div className="bg-white rounded-3xl shadow-xl p-2 border border-[#128a42]/10">
            <div className="flex items-center px-4 py-3">
              <span className="text-[#128a42] text-lg">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Where to park?"
                className="flex-1 ml-3 outline-none text-lg font-medium text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>
        </form>

        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="mt-2 bg-white rounded-3xl border border-zinc-200 shadow-2xl max-h-60 overflow-y-auto">
            {searchSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-5 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
              >
                <div className="text-sm font-bold text-zinc-900 truncate">📍 {s.display_name?.split(",")[0]}</div>
                <div className="text-[11px] text-zinc-400 truncate mt-0.5">{s.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POI chips — floating */}
      <div className="absolute top-[130px] left-0 right-0 z-[998] px-4 flex gap-1.5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        <button
          onClick={() => setShowPois(!showPois)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex-shrink-0 border shadow-sm ${
            showPois
              ? "bg-[#128a42] text-white border-[#128a42]"
              : "bg-white/90 backdrop-blur text-zinc-600 border-zinc-200"
          }`}
        >
          📍 {showPois ? "ON" : "OFF"}
        </button>
        {POI_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => togglePoiCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0 border shadow-sm ${
              activePoiCategories.has(cat.key)
                ? "bg-[#128a42] text-white border-[#128a42]"
                : "bg-white/90 backdrop-blur text-zinc-600 border-zinc-200"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* My Location FAB */}
      <button onClick={handleMyLocation} disabled={myLocating}
        className="absolute bottom-[220px] right-4 z-[999] w-12 h-12 rounded-full bg-white border border-zinc-200 shadow-xl flex items-center justify-center text-xl hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
        style={{ touchAction: "manipulation" }}
      >
        {myLocating ? (
          <span className="w-5 h-5 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" />
        ) : "📍"}
      </button>

      {/* Satellite toggle — floating */}
      <button onClick={() => setSatellite(!satellite)}
        className={`absolute bottom-[220px] left-4 z-[999] px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all border shadow-lg ${
          satellite
            ? "bg-[#128a42]/10 text-[#128a42] border-[#128a42]/30"
            : "bg-white/90 backdrop-blur text-zinc-600 border-zinc-200"
        }`}
      >
        {satellite ? "🛰 Satellite" : "🗺 Streets"}
      </button>

      {/* Search this area */}
      {showSearchArea && (
        <button onClick={() => { fetchSpaces(mapCenter[0], mapCenter[1]); fetchPois(mapCenter[0], mapCenter[1]); setShowSearchArea(false); }}
          className="absolute top-[165px] left-1/2 -translate-x-1/2 z-[999] bg-white text-[#128a42] border border-[#128a42]/30 rounded-full px-5 py-2 text-xs font-bold shadow-xl hover:bg-[#128a42]/5 transition-all active:scale-95"
        >
          🔍 Search this area
        </button>
      )}

      {/* Selected Space Card — floating above bottom sheet */}
      {selectedSpace && (
        <div className="absolute bottom-[180px] left-3 right-3 z-[999] bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl">
          {getPhotoUrl(selectedSpace) && (
            <div className="w-full h-32 relative">
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
          <div className="p-4">
            {!getPhotoUrl(selectedSpace) && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#128a42] to-[#0f7a39] rounded-2xl flex items-center justify-center text-3xl shadow-md">
                    {spaceIcon(selectedSpace.spaceType)}
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-zinc-950">{selectedSpace.name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{selectedSpace.address}</div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedSpace(null); }}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-all"
                >✕</button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="font-display font-extrabold text-lg text-[#128a42]">
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
              <Link href={`/space/${selectedSpace.id}`} className="flex-1 py-3 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-sm font-bold text-center transition-all active:scale-[0.98] shadow-lg shadow-[#128a42]/20">
                Details →
              </Link>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpace.latitude},${selectedSpace.longitude}`} target="_blank" rel="noopener"
                className="px-4 py-3 bg-[#128a42]/10 text-[#128a42] rounded-2xl text-sm font-bold hover:bg-[#128a42]/20 transition-all"
              >🧭</a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet — ParkSky style listings */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[998] transition-all duration-300 ${bottomSheetExpanded ? "max-h-[70vh]" : "max-h-[50vh]"}`}>
        <div className="w-12 h-1 bg-zinc-300 rounded-full mx-auto mt-3 cursor-pointer" onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)} />
        <div className="px-5 pt-4 pb-4 overflow-y-auto" style={{ maxHeight: bottomSheetExpanded ? "calc(70vh - 20px)" : "calc(50vh - 20px)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-xl text-zinc-950">Available Nearby</h2>
            <span className="text-xs text-zinc-500">
              {loading ? "Searching..." : (
                <><strong className="text-[#128a42]">{spaces.length}</strong> spots</>
              )}
            </span>
          </div>

          {spaces.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🅿</div>
              <p className="text-sm text-zinc-500 font-medium">No parking spots found nearby</p>
              <p className="text-xs text-zinc-400 mt-1">Try moving the map or searching a different area</p>
            </div>
          )}

          {spaces.map((space: any, i: number) => {
            const price = space.pricing?.[0];
            const photo = getPhotoUrl(space);
            return (
              <div
                key={space.id || i}
                onClick={() => setSelectedSpace(space)}
                className="bg-white border border-zinc-200 rounded-3xl p-5 mb-4 cursor-pointer hover:border-[#128a42] hover:shadow-lg transition-all active:scale-[0.99]"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#128a42] to-[#0f7a39] rounded-2xl flex items-center justify-center text-5xl flex-shrink-0 shadow-md overflow-hidden">
                    {photo ? (
                      <img src={photo} alt={space.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : spaceIcon(space.spaceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-lg text-zinc-900 truncate pr-2">{space.name}</div>
                      <div className="font-bold text-lg text-[#128a42] whitespace-nowrap">
                        {price ? `ETB ${price.price}` : "TBD"}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5 truncate">{space.address} {price ? `• ${price.rateType === "HOURLY" ? "per hour" : price.rateType === "DAILY" ? "per day" : "per month"}` : ""}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {space.ratingAvg > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          <span className="text-sm font-bold">{Number(space.ratingAvg).toFixed(1)}</span>
                        </div>
                      )}
                      <span className="text-[9px] px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-600 font-bold uppercase">{space.spaceType}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); openBooking(space); }}
                      className="mt-3 w-full bg-[#128a42] hover:bg-[#0f7a39] transition text-white py-3 rounded-2xl font-bold text-sm active:scale-[0.98] shadow-md shadow-[#128a42]/20"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal — Ethiopian Ribbon style */}
      {showBookingModal && bookingSpace && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Ethiopian Ribbon */}
            <div className="h-2" style={{ background: "linear-gradient(90deg, #009900 33%, #FFCC00 66%, #CC0000 100%)" }} />

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#128a42] to-[#0f7a39] rounded-2xl flex items-center justify-center text-2xl shadow-md">
                  {spaceIcon(bookingSpace.spaceType)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Confirm Your Booking</h2>
                  <p className="text-xs text-zinc-500">{bookingSpace.name}</p>
                </div>
              </div>

              {/* Ticket */}
              <div className="p-5 rounded-2xl border border-dashed border-zinc-300 mb-6" style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-zinc-900">{bookingSpace.name}</div>
                    <div className="text-slate-500 text-sm mt-0.5">{bookingSpace.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#128a42]">
                      {bookingSpace.pricing?.[0] ? `ETB ${bookingSpace.pricing[0].price}` : "TBD"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {bookingSpace.pricing?.[0] ? `per ${bookingSpace.pricing[0].rateType === "HOURLY" ? "hour" : bookingSpace.pricing[0].rateType === "DAILY" ? "day" : "month"}` : ""}
                    </div>
                  </div>
                </div>

                {bookingSpace.ratingAvg > 0 && (
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-bold">{Number(bookingSpace.ratingAvg).toFixed(1)}</span>
                    <span className="text-xs text-zinc-500 ml-1">rating</span>
                  </div>
                )}

                <Link
                  href={`/book/${bookingSpace.id}`}
                  onClick={() => setShowBookingModal(false)}
                  className="w-full bg-gradient-to-r from-[#128a42] to-[#0f7a39] text-white font-semibold py-4 rounded-2xl text-lg block text-center shadow-lg shadow-[#128a42]/30 active:scale-[0.98] transition-all"
                >
                  Pay &amp; Get Ticket
                </Link>
              </div>

              <button onClick={() => setShowBookingModal(false)} className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
