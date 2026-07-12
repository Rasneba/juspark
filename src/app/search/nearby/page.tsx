"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function NearbySearchPage() {
  const [spaces, setSpaces] = useState<Array<Record<string, unknown>>>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"distance" | "price" | "rating">("distance");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
        () => { setUserLocation({ lat: 9.0054, lng: 38.7636 }); setLocating(false); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation({ lat: 9.0054, lng: 38.7636 });
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    setLoading(true);
    setError("");
    fetch(`/api/parking?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50`)
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(d => setSpaces(d.spaces || []))
      .catch(() => setError("Unable to load parking spaces"))
      .finally(() => setLoading(false));
  }, [userLocation]);

  type SpaceWithDist = Record<string, unknown> & { _distance: number | null };

  const enriched: SpaceWithDist[] = spaces.map((s) => ({
    ...s,
    _distance: userLocation ? haversineDistance(userLocation.lat, userLocation.lng, Number(s.latitude), Number(s.longitude)) : null,
  }));

  const filtered = enriched
    .filter((s) => {
      const matchQuery = !query || String(s.name || "").toLowerCase().includes(query.toLowerCase()) || String(s.address || "").toLowerCase().includes(query.toLowerCase());
      let matchFilter = true;
      if (activeFilter === "covered") matchFilter = !!(s.isCovered || s.is_covered);
      else if (activeFilter === "ev") matchFilter = !!(s.isEvCharger || s.is_ev_charger);
      else if (activeFilter === "24_7") matchFilter = !!(s.is247 || s.is_24_7);
      else if (activeFilter !== "all") matchFilter = String(s.spaceType || s.space_type || "").toLowerCase() === activeFilter;
      return matchQuery && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return (a._distance ?? 999) - (b._distance ?? 999);
      if (sortBy === "price") return (Number((a.pricing as Array<Record<string, unknown>>)?.[0]?.price) || 999) - (Number((b.pricing as Array<Record<string, unknown>>)?.[0]?.price) || 999);
      if (sortBy === "rating") return (Number(b.ratingAvg || b.rating_avg) || 0) - (Number(a.ratingAvg || a.rating_avg) || 0);
      return 0;
    });

  const FILTERS = [
    { key: "all", label: "All" }, { key: "garage", label: "🏢 Garage" }, { key: "lot", label: "🅿 Lot" },
    { key: "driveway", label: "🏠 Driveway" }, { key: "covered", label: "☂ Covered" }, { key: "24_7", label: "🕐 24/7" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">←</Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">🅿 Find Parking</span>
          <Link href="/map" className="px-3 py-1.5 bg-[ethio-green] hover:bg-[ethio-green] text-white rounded-2xl text-xs font-bold transition-all">🗺 Map</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        <div className="relative mb-3">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</div>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[ethio-green] focus:ring-2 focus:ring-[ethio-green]/10 transition-all shadow-sm" />
        </div>

        {locating && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[ethio-green]/5 border border-[ethio-green]/20 text-[ethio-green] rounded-2xl mb-3 text-xs font-bold">
            <span className="w-3.5 h-3.5 border-2 border-[ethio-green] border-t-transparent rounded-full animate-spin" />
            Getting your location...
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                activeFilter === f.key
                  ? "bg-[ethio-green] text-white border-[ethio-green]"
                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500 font-bold">
            {loading ? "Searching..." : error ? <span className="text-[ethio-red]">{error}</span> : `${filtered.length} space${filtered.length !== 1 ? "s" : ""} nearby`}
          </span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "distance" | "price" | "rating")}
            className="bg-white border border-zinc-200 text-[10px] text-[ethio-green] font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer">
            <option value="distance">Nearest First</option>
            <option value="price">Lowest Price</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {filtered.length === 0 && !loading ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <div className="text-3xl mb-2">🅿</div>
            <p className="font-display font-bold text-sm text-zinc-800 mb-1">No parking found</p>
            <p className="text-xs text-zinc-500">Try a different search or filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((space) => {
              const pricing = (space.pricing as Array<Record<string, unknown>>)?.[0];
              const rateType = String(pricing?.rateType || pricing?.rate_type || "hourly").toLowerCase();
              const rateLabel = rateType === "hourly" ? "hr" : rateType === "daily" ? "day" : "mo";
              return (
                <Link key={String(space.id)} href={`/space/${space.id}`}
                  className="flex bg-white rounded-3xl border border-zinc-150 hover:border-[ethio-green]/30 hover:shadow-md overflow-hidden gap-3 transition-all group">
                  <div className="w-20 h-20 bg-zinc-50 flex items-center justify-center flex-shrink-0">
                    {(space.images as Array<Record<string, unknown>>)?.[0]?.url ? (
                      <img src={String((space.images as Array<Record<string, unknown>>)[0].url)} alt="" className="w-full h-full object-cover" />
                    ) : <span className="text-2xl">🅿</span>}
                  </div>
                  <div className="flex-1 py-3 pr-3 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold text-[ethio-green] bg-[ethio-green]/10 px-1.5 py-0.5 rounded-full uppercase">{String(space.spaceType || "Lot")}</span>
                      {Number(space.ratingAvg || space.rating_avg) > 0 && <span className="text-[10px] font-bold"><span className="text-[ethio-yellow]">★</span> {Number(space.ratingAvg || space.rating_avg).toFixed(1)}</span>}
                    </div>
                    <h3 className="font-display font-bold text-xs text-zinc-950 truncate group-hover:text-[ethio-green] transition-colors">{String(space.name)}</h3>
                    <p className="text-[10px] text-zinc-500 truncate">{String(space.address)}</p>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="font-extrabold text-[ethio-green] text-sm font-display">
                        {pricing ? `ETB ${pricing.price}` : "—"}
                        <span className="text-[9px] text-zinc-400 font-normal font-sans">/{rateLabel}</span>
                      </span>
                      {space._distance !== null && (
                        <span className="text-[9px] text-zinc-500 font-mono bg-zinc-50 px-1.5 py-0.5 rounded-md">
                          📍 {Number(space._distance) < 1 ? `${Math.round(Number(space._distance) * 1000)}m` : `${Number(space._distance).toFixed(1)}km`}
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
