"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function BookSpacePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const router = useRouter();
  const [space, setSpace] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(1);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadSpace(); }, []);

  const loadSpace = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/parking/${spaceId}`);
      if (res.ok) { const data = await res.json(); setSpace(data.space || data); }
    } catch { /* empty */ }
    setLoading(false);
  };

  const pricing = (space?.pricing as Array<Record<string, unknown>>)?.[0];
  const rateType = String(pricing?.rate_type || pricing?.rateType || "hourly").toLowerCase();
  const priceVal = Number(pricing?.price) || 0;
  const hourlyRate = rateType === "hourly" ? priceVal : rateType === "daily" ? priceVal / 24 : rateType === "monthly" ? priceVal / (30 * 24) : priceVal;
  const total = (hourlyRate * duration).toFixed(2);

  const handleBook = async () => {
    if (!api.checkAuth()) { router.push("/auth/login"); return; }
    if (!vehiclePlate.trim()) { setError("Please enter your vehicle plate number"); return; }
    setSubmitting(true);
    setError("");
    try {
      const start = new Date();
      const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
      const res = await api.post("/api/bookings", { spaceId, startTime: start.toISOString(), endTime: end.toISOString() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Booking failed");
      }
      router.push("/bookings");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create booking");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">
        <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="font-display font-bold text-sm">Space not found</p>
        <Link href="/search" className="text-[#128a42] font-bold text-xs hover:underline">← Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={`/space/${spaceId}`} className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">←</Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">Book Parking</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-4 pb-16">
        <Link href={`/space/${spaceId}`} className="text-[#128a42] font-bold text-xs hover:underline inline-block mb-3">← Back to Space</Link>

        <h1 className="font-display font-extrabold text-lg text-[#128a42] mb-0.5">Book Parking</h1>
        <p className="text-xs text-zinc-500 mb-4">{String(space.name)}</p>

        <div className="bg-white rounded-3xl border border-zinc-150 p-5 mb-3 shadow-sm">
          <h2 className="font-display font-bold text-xs text-zinc-950 mb-3 uppercase tracking-wider">Space Details</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Address</span>
              <span className="font-bold text-zinc-900 text-right max-w-[60%] truncate">{String(space.address)}</span>
            </div>
            {pricing && (
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Rate</span>
                <span className="font-bold text-zinc-900">ETB {String(pricing.price)}/{rateType === "hourly" ? "hour" : rateType === "daily" ? "day" : "month"}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Available Spots</span>
              <span className="font-bold text-zinc-900">{String(space.available_spots || space.availableSpots || 0)}/{String(space.total_spots || space.totalSpots || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-150 p-5 shadow-sm">
          <h2 className="font-display font-bold text-xs text-zinc-950 mb-4 uppercase tracking-wider">Booking Details</h2>

          {error && (
            <div className="px-4 py-3 bg-[#d92323]/10 border border-[#d92323]/30 text-[#d92323] rounded-2xl mb-4 text-xs font-bold">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-bold text-zinc-700 mb-2">Duration (hours)</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setDuration((d) => Math.max(1, d - 1))}
                className="w-10 h-10 rounded-2xl border border-zinc-200 bg-white text-lg font-bold flex items-center justify-center hover:bg-zinc-50 transition-all active:scale-95">−</button>
              <div className="flex-1 text-center">
                <span className="font-display font-extrabold text-2xl text-[#128a42]">{duration}</span>
                <span className="text-[10px] text-zinc-500 ml-1">hr{duration > 1 ? "s" : ""}</span>
              </div>
              <button onClick={() => setDuration((d) => Math.min(24, d + 1))}
                className="w-10 h-10 rounded-2xl border border-zinc-200 bg-white text-lg font-bold flex items-center justify-center hover:bg-zinc-50 transition-all active:scale-95">+</button>
            </div>
            <input type="range" min={1} max={24} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full mt-3" />
            <div className="flex justify-between text-[9px] text-zinc-400 mt-1 font-mono"><span>1h</span><span>6h</span><span>12h</span><span>24h</span></div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-zinc-700 mb-2">Vehicle Plate Number</label>
            <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="e.g. AA-12345"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:ring-2 focus:ring-[#128a42]/10 transition-all uppercase" />
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl mb-5">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-zinc-500">Rate</span>
              <span className="text-zinc-700">ETB {hourlyRate.toFixed(2)} × {duration}h</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
              <span className="font-display font-bold text-sm text-zinc-950">Total</span>
              <span className="font-display font-extrabold text-xl text-[#128a42]">ETB {total}</span>
            </div>
          </div>

          <button onClick={handleBook} disabled={submitting}
            className="w-full py-3.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#128a42]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
