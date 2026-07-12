"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    if (!api.checkAuth()) { window.location.href = "/auth/login"; return; }
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      setError("Unable to load bookings. Please try again.");
    }
    setLoading(false);
  };

  const isPast = (b: Record<string, unknown>) => {
    const status = String(b.status || "").toLowerCase();
    return status === "completed" || status === "cancelled" || status === "expired";
  };

  const filtered = bookings.filter((b) => (tab === "past" ? isPast(b) : !isPast(b)));

  const STATUS_STYLES: Record<string, string> = {
    confirmed: "bg-ethio-green/10 text-ethio-green",
    active: "bg-ethio-green/10 text-ethio-green",
    completed: "bg-ethio-green/10 text-ethio-green",
    pending: "bg-ethio-yellow/20 text-yellow-700",
    cancelled: "bg-ethio-red/10 text-ethio-red",
    expired: "bg-zinc-200 text-zinc-500",
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">←</Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">My Bookings</span>
          <Link href="/search" className="px-3 py-1.5 bg-[ethio-green] hover:bg-[ethio-green] text-white rounded-2xl text-xs font-bold transition-all">Search</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        <div className="flex gap-1.5 mb-4 p-1 bg-zinc-100 rounded-2xl">
          <button onClick={() => setTab("active")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === "active" ? "bg-[ethio-green] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}>Active</button>
          <button onClick={() => setTab("past")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === "past" ? "bg-[ethio-green] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}>Past</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[ethio-green] border-t-transparent rounded-full animate-spin" />
            Loading bookings...
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <p className="text-sm font-bold text-[ethio-red] mb-2">{error}</p>
            <button onClick={loadBookings} className="px-5 py-2 bg-[ethio-green] text-white rounded-2xl text-xs font-bold hover:bg-[ethio-green] transition-all">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <div className="text-3xl mb-2">📋</div>
            <p className="font-display font-bold text-sm text-zinc-800 mb-1">
              {tab === "active" ? "No active bookings" : "No past bookings"}
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              {tab === "active" ? "Find and book a parking space" : "Past bookings appear here"}
            </p>
            {tab === "active" && (
              <Link href="/search" className="inline-block px-6 py-2.5 bg-[ethio-green] text-white rounded-2xl text-xs font-bold hover:bg-[ethio-green] transition-all">Search Parking</Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((booking) => {
              const statusKey = String(booking.status || "").toLowerCase();
              const statusStyle = STATUS_STYLES[statusKey] || "bg-zinc-200 text-zinc-500";
              return (
                <div key={String(booking.id)} className="flex items-center justify-between p-4 bg-white rounded-3xl border border-zinc-150">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-sm text-zinc-950 truncate">
                      {String(booking.space_name || booking.spaceName || (booking.space as Record<string, unknown>)?.name || "Parking Space")}
                    </h3>
                    <div className="flex gap-3 mt-1 text-[11px] text-zinc-500">
                      {booking.date ? <span>{String(booking.date)}</span> : null}
                      {booking.duration ? <span>{String(booking.duration)}h</span> : null}
                      {booking.amount ? <span className="font-bold text-ethio-green">ETB {String(booking.amount)}</span> : null}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize flex-shrink-0 ${statusStyle}`}>
                    {String(booking.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
