"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function SpaceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapSatellite, setMapSatellite] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/parking/${id}`);
        if (!res.ok) throw new Error("Space not found");
        const data = await res.json();
        setSpace(data.space || data);
        try {
          const revRes = await api.get(`/api/reviews?spaceId=${id}`);
          if (revRes.ok) { const rd = await revRes.json(); setReviews(rd.reviews || []); }
        } catch { /* empty */ }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load parking space");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Header />
        <div className="text-center py-24 text-zinc-500 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" /> Loading parking space...
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Header />
        <div className="text-center py-24">
          <p className="font-display font-bold text-lg text-[#d92323] mb-2">{error || "Space not found"}</p>
          <Link href="/search" className="text-[#128a42] font-bold text-sm hover:underline">Back to Search</Link>
        </div>
      </div>
    );
  }

  const pricing = Array.isArray(space.pricing) ? (space.pricing as Array<Record<string, unknown>>) : [];
  const hourly = pricing.find((p) => String(p.rate_type || p.rateType).toLowerCase() === "hourly");
  const daily = pricing.find((p) => String(p.rate_type || p.rateType).toLowerCase() === "daily");
  const monthly = pricing.find((p) => String(p.rate_type || p.rateType).toLowerCase() === "monthly");
  const lat = Number(space.latitude || space.lat) || 9.0054;
  const lng = Number(space.longitude || space.lng) || 38.7636;
  const mapStreetSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapSatSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=satellite&marker=${lat}%2C${lng}`;
  const photos = Array.isArray(space.images) && space.images.length > 0
    ? (space.images as Array<Record<string, unknown>>)
    : (space.primary_photo ? [{ url: space.primary_photo, isPrimary: true }] : []);

  const spaceTypeIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "garage") return "🏢";
    if (t === "driveway") return "🏡";
    if (t === "street") return "🛣";
    return "🅿";
  };

  const slotType = (p: Record<string, unknown>) => {
    const rt = String(p.rate_type || p.rateType).toLowerCase();
    if (rt === "hourly") return "hr";
    if (rt === "daily") return "day";
    return "mo";
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-4 pb-20">

        {/* Photo Gallery */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-4">
          <div className="h-64 bg-zinc-100 relative">
            {photos.length > 0 ? (
              <>
                <img src={String(photos[activePhoto]?.url || photos[0]?.url)} alt={String(space.name)} className="w-full h-full object-cover" />
                {photos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                    {photos.map((_: unknown, i: number) => (
                      <button key={i} onClick={() => setActivePhoto(i)} className={`rounded-full transition-all ${activePhoto === i ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
                    ))}
                  </div>
                )}
                {photos.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white rounded-xl px-2.5 py-1 text-[10px] font-bold">{activePhoto + 1}/{photos.length}</div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-30">🅿</span>
              </div>
            )}
          </div>
        </div>

        {/* Space Info Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-[#128a42] bg-[#128a42]/10 px-2.5 py-1 rounded-full border border-[#128a42]/20 uppercase">{String(space.space_type || space.spaceType)}</span>
            {Number(space.rating_avg || space.ratingAvg) > 0 && (
              <span className="text-xs font-bold text-zinc-800">
                <span className="text-[#facc15]">★</span> {Number(space.rating_avg || space.ratingAvg).toFixed(1)}
                {(space.review_count || space.reviewCount) ? <span className="text-zinc-400 font-normal ml-1">({String(space.review_count || space.reviewCount)})</span> : null}
              </span>
            )}
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-50 px-2 py-0.5 rounded-md ml-auto">
              {String(space.available_spots ?? space.availableSpots ?? "—")}/{String(space.total_spots ?? space.totalSpots ?? "—")} spots
            </span>
          </div>

          <h1 className="font-display font-extrabold text-xl text-zinc-950 mb-1">{String(space.name)}</h1>
          <p className="text-xs text-zinc-500 mb-3">{String(space.address)}</p>

          <div className="flex gap-2 flex-wrap mb-4">
            {!!(space.is_covered || space.isCovered) && <span className="text-[10px] font-bold px-2.5 py-1 bg-[#128a42]/5 text-[#128a42] rounded-full border border-[#128a42]/20">☂ Covered</span>}
            {!!(space.is_ev_charger || space.isEvCharger) && <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">⚡ EV Charging</span>}
            {!!(space.is_24_7 || space.is247) && <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">🕐 24/7</span>}
          </div>

          {!!space.description && <p className="text-xs text-zinc-500 leading-relaxed mb-4">{String(space.description)}</p>}

          {!!(space.host_name || space.hostName || space.host) && (
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-2xl text-xs">
              <span className="text-lg">👤</span>
              <span className="font-bold text-zinc-700">Hosted by </span>
              <span className="text-zinc-900 font-medium">{String(space.host_name || space.hostName || (space.host as Record<string, unknown>)?.name || "Host")}</span>
            </div>
          )}
        </div>

        {/* Pricing — Ticket style */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm p-5 mb-4">
          <h2 className="font-display font-bold text-sm text-zinc-950 mb-4">Pricing</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Hourly", data: hourly, icon: "⏱" },
              { label: "Daily", data: daily, icon: "📅" },
              { label: "Monthly", data: monthly, icon: "📆" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl border-2 text-center transition-all" style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-[10px] text-zinc-500 mb-1 font-medium">{item.label}</div>
                <div className="font-display font-extrabold text-sm text-[#128a42]">
                  {item.data ? `ETB ${item.data.price}` : "—"}
                </div>
                {item.data && <div className="text-[9px] text-zinc-400 mt-0.5">per {slotType(item.data)}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket-style Booking CTA */}
        <div className="rounded-3xl overflow-hidden shadow-sm mb-4">
          <div className="h-1.5" style={{ background: "linear-gradient(90deg, #009900 33%, #FFCC00 66%, #CC0000 100%)" }} />
          <div className="bg-white p-5 border border-t-0 border-zinc-100 rounded-b-3xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="font-display font-bold text-lg text-zinc-900">{String(space.name)}</div>
                <div className="text-slate-500 text-sm mt-0.5">{String(space.address)}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#128a42]">
                  {hourly ? `ETB ${hourly.price}` : daily ? `ETB ${daily.price}` : monthly ? `ETB ${monthly.price}` : "TBD"}
                </div>
                <div className="text-sm text-slate-500">
                  per {hourly ? "hour" : daily ? "day" : monthly ? "month" : ""}
                </div>
              </div>
            </div>

            <Link href={`/book/${space.id}`} className="w-full bg-gradient-to-r from-[#128a42] to-[#0f7a39] text-white font-semibold py-4 rounded-2xl text-lg block text-center shadow-lg shadow-[#128a42]/30 active:scale-[0.98] transition-all">
              Pay &amp; Get Ticket
            </Link>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-4">
          <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-100">
            <h2 className="font-display font-bold text-sm text-zinc-950">Location</h2>
            <div className="flex gap-1.5">
              <button onClick={() => setMapSatellite(false)} className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${!mapSatellite ? "bg-[#128a42] text-white border-[#128a42]" : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"}`}>🗺 Streets</button>
              <button onClick={() => setMapSatellite(true)} className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${mapSatellite ? "bg-[#128a42]/10 text-[#128a42] border-[#128a42]/30" : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"}`}>🛰 Satellite</button>
            </div>
          </div>
          <iframe title="Parking Location" width="100%" height="260" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapSatellite ? mapSatSrc : mapStreetSrc} />
          <div className="px-5 py-3 flex gap-2">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener"
              className="flex-1 py-2.5 bg-[#128a42]/10 text-[#128a42] rounded-2xl text-xs font-bold text-center hover:bg-[#128a42]/20 transition-all">
              🧭 Get Directions
            </a>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm p-5">
          <h2 className="font-display font-bold text-sm text-zinc-950 mb-3">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-xs text-zinc-500">No reviews yet. Be the first to book and review!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div key={String(review.id || i)} className="p-3 bg-zinc-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-zinc-900">{String(review.user_name || review.userName || "Anonymous")}</span>
                    <span className="text-[11px] font-bold"><span className="text-[#facc15]">★</span> {String(review.rating)}</span>
                  </div>
                  {!!review.comment && <p className="text-[11px] text-zinc-500">{String(review.comment)}</p>}
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
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <div className="h-1" style={{ background: "linear-gradient(90deg, #009900 33%, #FFCC00 66%, #CC0000 100%)" }} />
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 bg-gradient-to-br from-[#128a42] to-[#0f7a39] rounded-2xl flex items-center justify-center text-white text-xl shadow-md shadow-[#128a42]/20">🅿</div>
          <span className="font-display font-extrabold text-lg tracking-tighter text-[#128a42]">Park<span className="text-zinc-900">Eth</span></span>
        </Link>
        <Link href="/auth/login" className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-3xl text-sm hover:bg-zinc-50 transition-all">
          👤 <span className="font-medium text-zinc-700">Sign In</span>
        </Link>
      </div>
    </nav>
  );
}
