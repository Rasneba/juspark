"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_BASE = "";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export default function SpaceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapSatellite, setMapSatellite] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/parking/${id}`);
        if (!res.ok) throw new Error("Space not found");
        const data = await res.json();
        setSpace(data.space || data);
        try {
          const revRes = await apiFetch(`/api/reviews?spaceId=${id}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(revData.reviews || []);
          }
        } catch { }
      } catch (e: any) {
        setError(e.message || "Failed to load parking space");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Header />
        <div className="text-center py-24 text-zinc-500 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" />
          Loading parking space...
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Header />
        <div className="text-center py-24">
          <p className="font-display font-bold text-lg text-[#128a42] mb-2">{error || "Space not found"}</p>
          <Link href="/search" className="text-[#128a42] font-bold text-sm hover:underline">Back to Search</Link>
        </div>
      </div>
    );
  }

  const pricing = Array.isArray(space.pricing) ? space.pricing : [];
  const hourly = pricing.find((p: any) => p.rate_type === "hourly" || p.rateType === "hourly");
  const daily = pricing.find((p: any) => p.rate_type === "daily" || p.rateType === "daily");
  const monthly = pricing.find((p: any) => p.rate_type === "monthly" || p.rateType === "monthly");
  const lat = space.latitude || space.lat || 9.0054;
  const lng = space.longitude || space.lng || 38.7636;
  const mapStreetSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapSatSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=satellite&marker=${lat}%2C${lng}`;
  const photos = space.images?.length > 0 ? space.images : (space.primary_photo ? [{ url: space.primary_photo, isPrimary: true }] : []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans select-none antialiased">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-4 pb-16">
        <Link href="/search" className="inline-flex items-center gap-1.5 text-zinc-500 text-xs font-bold mb-4 hover:text-[#128a42] transition-colors">
          ← Back to Search
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-zinc-150 overflow-hidden shadow-sm">
          {/* Photo gallery */}
          <div className="h-72 bg-zinc-100 relative">
            {photos.length > 0 ? (
              <>
                <img src={photos[activePhoto]?.url || photos[0]?.url} alt={space.name} className="w-full h-full object-cover" />
                {photos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                    {photos.map((_: any, i: number) => (
                      <button key={i} onClick={() => setActivePhoto(i)}
                        className={`rounded-full transition-all ${
                          activePhoto === i ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
                {photos.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white rounded-xl px-2.5 py-1 text-[10px] font-bold">
                    {activePhoto + 1}/{photos.length}
                  </div>
                )}
              </>
            ) : (
              <span className="text-5xl text-zinc-300">🅿</span>
            )}
          </div>

          <div className="p-5">
            {/* Type badge + rating */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#128a42] bg-[#128a42]/10 px-2.5 py-1 rounded-full border border-[#128a42]/20 uppercase">
                  {space.space_type || space.spaceType}
                </span>
                {(space.rating_avg || space.ratingAvg) && (
                  <span className="text-xs font-bold text-zinc-800">
                    <span className="text-[#facc15]">★</span> {Number(space.rating_avg || space.ratingAvg).toFixed(1)}
                    {(space.review_count || space.reviewCount) ? (
                      <span className="text-zinc-400 font-normal ml-1">({space.review_count || space.reviewCount})</span>
                    ) : null}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-50 px-2 py-0.5 rounded-md">
                {space.available_spots ?? space.availableSpots ?? "—"}/{space.total_spots ?? space.totalSpots ?? "—"} spots
              </span>
            </div>

            <h1 className="font-display font-extrabold text-xl text-zinc-950 mb-1">{space.name}</h1>
            <p className="text-xs text-zinc-500 mb-4">{space.address}</p>

            {/* Feature badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              {(space.is_covered || space.isCovered) && (
                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#128a42]/5 text-[#128a42] rounded-full border border-[#128a42]/20">☂ Covered</span>
              )}
              {(space.is_ev_charger || space.isEvCharger) && (
                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#128a42]/5 text-[#128a42] rounded-full border border-[#128a42]/20">⚡ EV Charging</span>
              )}
              {(space.is_24_7 || space.is247) && (
                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#facc15]/10 text-[#b8860b] rounded-full border border-[#facc15]/30">🕐 24/7 Access</span>
              )}
            </div>

            {space.description && (
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">{space.description}</p>
            )}

            {(space.host_name || space.hostName || space.host) && (
              <div className="px-4 py-3 bg-zinc-50 rounded-2xl mb-4 text-xs">
                <span className="font-bold text-zinc-700">Hosted by </span>
                <span className="text-zinc-900">{space.host_name || space.hostName || space.host?.name || "Host"}</span>
              </div>
            )}

            {/* Pricing grid */}
            <div className="border-t border-zinc-100 pt-4 mb-4">
              <h2 className="font-display font-bold text-sm text-zinc-950 mb-3">Pricing</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Hourly", data: hourly, icon: "⏱" },
                  { label: "Daily", data: daily, icon: "📅" },
                  { label: "Monthly", data: monthly, icon: "📆" },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                    <div className="text-base mb-1">{item.icon}</div>
                    <div className="text-[10px] text-zinc-500 mb-0.5">{item.label}</div>
                    <div className="font-display font-extrabold text-sm text-[#128a42]">
                      {item.data ? `ETB ${item.data.price}` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Link href={`/book/${space.id}`}
                className="flex-1 py-3.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-sm font-bold text-center transition-all shadow-lg shadow-[#128a42]/20 active:scale-[0.98]">
                Book Now
              </Link>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank" rel="noopener"
                className="px-4 py-3.5 bg-[#128a42]/10 text-[#128a42] rounded-2xl text-sm font-bold hover:bg-[#128a42]/20 transition-all">
                🧭
              </a>
            </div>
          </div>
        </div>

        {/* Map card */}
        <div className="bg-white rounded-3xl border border-zinc-150 mt-4 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-100">
            <h2 className="font-display font-bold text-sm text-zinc-950">Location</h2>
            <div className="flex gap-1.5">
              <button onClick={() => setMapSatellite(false)}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                  !mapSatellite ? "bg-[#128a42] text-white border-[#128a42]" : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                }`}>
                🗺 Streets
              </button>
              <button onClick={() => setMapSatellite(true)}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                  mapSatellite ? "bg-[#128a42]/10 text-[#128a42] border-[#128a42]/30" : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                }`}>
                🛰 Satellite
              </button>
            </div>
          </div>
          <iframe title="Parking Location" width="100%" height="300" style={{ border: 0 }} loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" src={mapSatellite ? mapSatSrc : mapStreetSrc} />
        </div>

        {/* Reviews card */}
        <div className="bg-white rounded-3xl border border-zinc-150 mt-4 p-5 shadow-sm">
          <h2 className="font-display font-bold text-sm text-zinc-950 mb-3">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-xs text-zinc-500">No reviews yet. Be the first to book and review this space!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any, i: number) => (
                <div key={review.id || i} className="p-3 bg-zinc-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-zinc-900">{review.user_name || review.userName || "Anonymous"}</span>
                    <span className="text-[11px] font-bold"><span className="text-[#facc15]">★</span> {review.rating}</span>
                  </div>
                  {review.comment && <p className="text-[11px] text-zinc-500">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/search" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">
          ←
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 bg-gradient-to-r from-[#128a42] via-[#facc15] to-[#d92323] p-[1px] rounded-lg">
            <div className="w-full h-full bg-white rounded-[7px] flex items-center justify-center">
              <span className="text-[8px]">🅿</span>
            </div>
          </div>
          <span className="font-display font-bold text-sm text-zinc-950">PARKme <span className="text-[#128a42]">Ethiopia</span></span>
        </div>
        <Link href="/auth/login" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-xs font-bold transition-all">
          Sign In
        </Link>
      </div>
    </header>
  );
}
