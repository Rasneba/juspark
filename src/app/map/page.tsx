"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import BookingModal from "@/components/BookingModal";
import ProfileDrawer from "@/components/ProfileDrawer";

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full map-container flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">🅿</div>
        <div className="font-display font-bold text-zinc-600 text-sm">Finding parking near you...</div>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [satellite, setSatellite] = useState(false);
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [myLocating, setMyLocating] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const fetchingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("parkme_profile");
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
    const storedBookings = localStorage.getItem("parkme_bookings");
    if (storedBookings) try { setBookings(JSON.parse(storedBookings)); } catch {}
  }, []);

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

  useEffect(() => {
    fetchSpaces(mapCenter[0], mapCenter[1]);
    handleMyLocation();
  }, []);

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

  const handleSuggestionClick = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setMapCenter([lat, lng]);
    setSearchResult({ lat, lng, name: s.display_name?.split(",")[0] || s.display_name });
    setShowSuggestions(false);
    setQuery(s.display_name?.split(",")[0] || "");
    fetchSpaces(lat, lng);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setMyLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setMyLocating(false);
        if ((window as any).__leafletMapView) {
          (window as any).__leafletMapView.showMyLocation(lat, lng);
        }
        fetchSpaces(lat, lng);
      },
      () => { setMyLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const filteredSpaces = spaces.filter((s) => {
    const matchSearch = !query || s.name?.toLowerCase().includes(query.toLowerCase()) || s.address?.toLowerCase().includes(query.toLowerCase());
    if (activeFilter === "all") return matchSearch;
    if (activeFilter === "garage") return matchSearch && String(s.space_type || s.spaceType).toLowerCase() === "garage";
    if (activeFilter === "driveway") return matchSearch && String(s.space_type || s.spaceType).toLowerCase() === "driveway";
    if (activeFilter === "ev") return matchSearch && (s.is_ev_charger || s.isEvCharger);
    if (activeFilter === "covered") return matchSearch && (s.is_covered || s.isCovered);
    return matchSearch;
  });

  const sortedSpaces = [...filteredSpaces].sort((a, b) => {
    if (sortBy === "price") {
      const pa = Number(a.pricing?.[0]?.price || 999);
      const pb = Number(b.pricing?.[0]?.price || 999);
      return pa - pb;
    }
    if (sortBy === "rating") return Number(b.rating_avg || b.ratingAvg || 0) - Number(a.rating_avg || a.ratingAvg || 0);
    return 0;
  });

  const spaceIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "garage") return "🏢";
    if (t === "driveway") return "🏡";
    if (t === "street") return "🛣";
    return "🅿";
  };

  const handleConfirmBooking = () => {
    const newBooking = {
      id: `bk-${Date.now()}`,
      spot_name: selectedSpace?.name,
      space_id: selectedSpace?.id,
      status: "active",
      total_cost: Number(selectedSpace?.pricing?.[0]?.price || 35),
      duration_hours: 2,
      gate_code: "GATE-" + Math.floor(1000 + Math.random() * 9000),
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem("parkme_bookings", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased overflow-x-hidden">

      {/* Top Bar — matches reference exactly */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-zinc-200/80 z-50 h-16 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer select-none">
            <div className="w-10 h-10 bg-gradient-to-r from-ethio-green via-ethio-yellow to-ethio-red p-[2px] rounded-2xl shadow-lg">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <span className="text-sm font-black">🅿</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg tracking-tighter text-zinc-950">
                  Park<span className="text-ethio-green">Eth</span>
                </span>
              </div>
              <div className="flex items-center gap-1 -mt-0.5">
                <span className="text-[9px] font-mono font-bold tracking-wider text-ethio-green uppercase">ፓርክ · ኢትዮጵያ</span>
                <span className="text-[8px] text-zinc-300">•</span>
                <span className="text-[9px] font-mono font-bold tracking-wider text-ethio-red uppercase">ETHIOPIA</span>
              </div>
            </div>
          </Link>

          {/* Center: Search on mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="relative flex-1">
              <input type="text" value={query} onChange={(e) => handleSearchInputChange(e.target.value)} onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)} placeholder="Search spots..." className="w-48 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-ethio-green transition-all" />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl flex items-center justify-center font-bold text-sm relative border border-zinc-200 transition-all shadow-sm">
              👤
              {bookings.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ethio-green text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-bounce">{bookings.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content — Split Layout */}
      <div className="pt-16 flex-1 flex flex-row relative overflow-hidden h-[calc(100vh-4rem)]">

        {/* LEFT SIDEBAR — 420px desktop, drawer on mobile */}
        <div className={`${mobileListOpen ? "fixed inset-0 z-[99] pt-16" : "hidden"} md:relative md:block w-full md:w-[420px] bg-white border-r border-zinc-200/80 flex flex-col h-full z-10 flex-shrink-0 shadow-sm`}>

          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200">
            <span className="font-display font-bold text-sm">Available Nearby</span>
            <button onClick={() => setMobileListOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">✕</button>
          </div>

          {/* Search & Filters */}
          <div className="p-5 border-b border-zinc-200/60 space-y-4 bg-zinc-50/40">
            {/* Search */}
            <div className="relative hidden md:block">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
              <input type="text" value={query} onChange={(e) => handleSearchInputChange(e.target.value)} onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)} placeholder="Airport, Stadium, Office..." className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-ethio-green focus:bg-white transition-all" />
              {query && <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1">✕</button>}
            </div>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-5 right-5 top-[72px] md:top-auto md:relative md:mt-0 mt-0 bg-white rounded-2xl border border-zinc-200 shadow-2xl z-[100] max-h-60 overflow-y-auto">
                {searchSuggestions.map((s: any, i: number) => (
                  <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0">
                    <div className="text-xs font-bold text-zinc-900 truncate">📍 {s.display_name?.split(",")[0]}</div>
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">{s.display_name}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Filter Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { key: "all", label: "All Spots" },
                { key: "driveway", label: "🏡 Driveways" },
                { key: "garage", label: "🏢 Garages" },
                { key: "ev", label: "⚡ EV" },
                { key: "covered", label: "☂ Covered" },
              ].map((f) => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} className={`px-3.5 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap ${activeFilter === f.key ? "bg-ethio-green text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-200/60 pt-3">
              <div className="flex items-center gap-1 font-semibold">
                <span>📍</span>
                <span>Available Nearby</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Sort:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none text-ethio-green font-bold outline-none cursor-pointer text-xs">
                  <option value="price">Lowest Price</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parking Listings */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 md:pb-6">
            {loading && (
              <div className="flex items-center justify-center py-8 text-zinc-500 text-xs gap-2">
                <span className="w-3 h-3 border-2 border-ethio-green border-t-transparent rounded-full animate-spin" /> Searching...
              </div>
            )}
            {!loading && sortedSpaces.length === 0 && (
              <div className="bg-zinc-100/60 border border-zinc-200 p-8 rounded-3xl text-center text-zinc-500 space-y-3">
                <div className="text-3xl">🚗</div>
                <p className="text-sm font-semibold text-zinc-800">No spots found nearby</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">Try adjusting your search or moving the map to a different area.</p>
              </div>
            )}
            {!loading && sortedSpaces.map((space: any) => {
              const isSelected = space.id === selectedSpace?.id;
              const price = space.pricing?.[0];
              return (
                <div key={space.id} onClick={() => setSelectedSpace(space)} className={`p-4 rounded-3xl border cursor-pointer flex gap-4 transition-all ${isSelected ? "bg-green-50/50 border-ethio-green shadow-md shadow-green-500/5" : "bg-white border-zinc-150 hover:bg-zinc-50/50 hover:border-zinc-350"}`}>
                  <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex flex-col items-center justify-center border border-zinc-200 flex-shrink-0 text-2xl shadow-sm">
                    {spaceIcon(space.space_type || space.spaceType)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-zinc-950 text-sm truncate leading-snug">{space.name}</h4>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{space.address}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <div className="flex items-center gap-2.5 text-zinc-500">
                        <span className="flex items-center gap-0.5 font-bold text-zinc-800">
                          <span className="text-ethio-yellow">★</span> {Number(space.rating_avg || space.ratingAvg || 0).toFixed(1)}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">{space.space_type || space.spaceType}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-ethio-green text-sm">ETB {price ? price.price : "TBD"}</span>
                        <span className="text-[10px] text-zinc-400 block -mt-1 font-mono">per {price?.rateType === "HOURLY" ? "hour" : price?.rate_type === "HOURLY" ? "hour" : "day"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Map */}
        <div className="flex-1 relative h-full">
          <MapView
            center={mapCenter}
            spaces={spaces}
            pois={[]}
            selectedId={selectedSpace?.id || null}
            satellite={satellite}
            showPois={false}
            searchResult={searchResult}
            onCenterChange={(lat: number, lng: number) => setMapCenter([lat, lng])}
            onSelectSpace={setSelectedSpace}
          />

          {/* Floating controls */}
          <button onClick={handleMyLocation} disabled={myLocating} className="absolute top-4 right-4 z-[999] w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-lg flex items-center justify-center hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50">
            {myLocating ? <span className="w-4 h-4 border-2 border-ethio-green border-t-transparent rounded-full animate-spin" /> : "📍"}
          </button>

          <button onClick={() => setSatellite(!satellite)} className={`absolute top-16 right-4 z-[999] px-3 py-2 rounded-2xl text-[10px] font-bold transition-all border shadow-lg ${satellite ? "bg-ethio-green/10 text-ethio-green border-ethio-green/30" : "bg-white text-zinc-600 border-zinc-200"}`}>
            {satellite ? "🛰 Satellite" : "🗺 Streets"}
          </button>

          {/* Mobile list toggle */}
          <button onClick={() => setMobileListOpen(true)} className="md:hidden absolute bottom-4 left-4 right-4 z-[999] py-3 bg-ethio-green hover:bg-green-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-ethio-green/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            📍 {sortedSpaces.length} spots nearby — View List
          </button>

          {/* Selected Spot Bottom Banner — matches reference */}
          {selectedSpace && (
            <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border border-zinc-200 p-5 rounded-3xl shadow-2xl z-40 space-y-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono text-ethio-green bg-ethio-green/10 px-2.5 py-1 rounded-full border border-ethio-green/20 uppercase font-extrabold">
                    {(selectedSpace.space_type || selectedSpace.spaceType || "parking").toLowerCase()} spot
                  </span>
                  <h4 className="font-extrabold text-zinc-950 text-base mt-2 font-display">{selectedSpace.name}</h4>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{selectedSpace.address}</p>
                </div>
                <button onClick={() => setSelectedSpace(null)} className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors">✕</button>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5">
                {!!(selectedSpace.is_covered || selectedSpace.isCovered) && <span className="text-[9px] font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-lg">☂ Covered</span>}
                {!!(selectedSpace.is_ev_charger || selectedSpace.isEvCharger) && <span className="text-[9px] font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-lg">⚡ EV Charging</span>}
                {!!(selectedSpace.is_24_7 || selectedSpace.is247) && <span className="text-[9px] font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-lg">🕐 24/7</span>}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-150 pt-4 mt-2">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono block">ESTIMATED RATE</span>
                  <span className="text-xl font-black text-ethio-green font-display">
                    ETB {selectedSpace.pricing?.[0]?.price || "TBD"}
                    <span className="text-xs text-zinc-500 font-normal">/hr</span>
                  </span>
                </div>
                <button onClick={() => setIsBookingOpen(true)} className="bg-ethio-green hover:bg-green-700 active:scale-95 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-green-500/10 transition-all flex items-center gap-2">
                  <span>Book Parking</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && selectedSpace && (
        <BookingModal space={selectedSpace} onClose={() => setIsBookingOpen(false)} onConfirm={handleConfirmBooking} />
      )}

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} bookings={bookings} />
    </div>
  );
}
