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

  useEffect(() => { if (userLocation) loadSpaces(); }, [userLocation]);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parking?lat=${userLocation?.lat || 9.0054}&lng=${userLocation?.lng || 38.7636}&radius=50`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch { setSpaces([]); }
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans select-none antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">
            ←
          </Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">🅿 Find Parking</span>
          <Link href="/map" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-xs font-bold transition-all">
            🗺 Map
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        {/* Search bar */}
        <div className="relative mb-3">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</div>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] transition-all shadow-sm" />
        </div>

        {locating && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#128a42]/5 border border-[#128a42]/20 text-[#128a42] rounded-2xl mb-3 text-xs font-bold">
            <span className="w-3.5 h-3.5 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" />
            Getting your location...
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3" style={{ WebkitOverflowScrolling: "touch" }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                activeFilter === f.key
                  ? "bg-[#128a42] text-white border-[#128a42]"
                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
              }`}>
              {f.icon ? `${f.icon} ` : ""}{f.label}
            </button>
          ))}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500 font-bold">
            {loading ? "Searching..." : `${filtered.length} space${filtered.length !== 1 ? "s" : ""} nearby`}
          </span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-zinc-200 text-[10px] text-[#128a42] font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer">
            <option value="distance">Nearest First</option>
            <option value="price">Lowest Price</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Results */}
        {filtered.length === 0 && !loading ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <div className="text-3xl mb-2">🅿</div>
            <p className="font-display font-bold text-sm text-zinc-800 mb-1">No parking found</p>
            <p className="text-xs text-zinc-500">Try a different search or filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((space) => {
              const price = space.pricing?.[0];
              const rateLabel = price?.rateType === "HOURLY" ? "hr" : price?.rateType === "DAILY" ? "day" : "mo";
              return (
                <Link key={space.id} href={`/space/${space.id}`}
                  className="flex bg-white rounded-3xl border border-zinc-150 hover:border-[#128a42]/30 hover:shadow-md overflow-hidden gap-3 transition-all group">
                  <div className="w-20 h-20 bg-zinc-50 flex items-center justify-center flex-shrink-0">
                    {space.images?.[0]?.url ? (
                      <img src={space.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🅿</span>
                    )}
                  </div>
                  <div className="flex-1 py-3 pr-3 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold text-[#128a42] bg-[#128a42]/10 px-1.5 py-0.5 rounded-full uppercase">
                        {space.spaceType || "Lot"}
                      </span>
                      {space.ratingAvg > 0 && (
                        <span className="text-[10px] font-bold"><span className="text-[#facc15]">★</span> {Number(space.ratingAvg).toFixed(1)}</span>
                      )}
                      {space.is247 && <span className="text-[8px] px-1.5 py-0.5 bg-[#facc15]/10 text-[#b8860b] rounded-full font-bold">24/7</span>}
                    </div>
                    <h3 className="font-display font-bold text-xs text-zinc-950 truncate group-hover:text-[#128a42] transition-colors">{space.name}</h3>
                    <p className="text-[10px] text-zinc-500 truncate">{space.address}</p>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="font-extrabold text-[#128a42] text-sm font-display">
                        {price ? `ETB ${price.price}` : "—"}
                        <span className="text-[9px] text-zinc-400 font-normal font-sans">/{rateLabel}</span>
                      </span>
                      {space._distance !== null && (
                        <span className="text-[9px] text-zinc-500 font-mono bg-zinc-50 px-1.5 py-0.5 rounded-md">
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
