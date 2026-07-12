"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function HostListingsPage() {
  const [spaces, setSpaces] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!api.checkAuth()) { window.location.href = "/auth/login"; return; }
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/owner/listings");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch {
      setError("Unable to load listings");
    }
    setLoading(false);
  };

  const toggleActive = async (space: Record<string, unknown>) => {
    const id = String(space.id);
    const isActive = space.is_active !== false && space.isActive !== false;
    setTogglingId(id);
    try {
      await api.patch(`/api/parking/${id}`, { status: isActive ? "INACTIVE" : "ACTIVE" });
      setSpaces((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !isActive, isActive: !isActive } : s));
    } catch { /* empty */ }
    setTogglingId(null);
  };

  const deleteSpace = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this space? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await api.delete(`/api/parking/${id}`);
      if (res.ok) setSpaces((prev) => prev.filter((s) => s.id !== id));
    } catch { /* empty */ }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/host" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">←</Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">My Listings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        <p className="text-xs text-zinc-500 font-bold mb-3">{spaces.length} total spaces</p>

        {loading ? (
          <div className="text-center py-12 text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[ethio-green] border-t-transparent rounded-full animate-spin" /> Loading listings...
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <p className="text-sm font-bold text-[ethio-red] mb-2">{error}</p>
            <button onClick={loadSpaces} className="px-5 py-2 bg-[ethio-green] text-white rounded-2xl text-xs font-bold hover:bg-[ethio-green] transition-all">Retry</button>
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <div className="text-3xl mb-2">🅿</div>
            <p className="font-display font-bold text-sm text-zinc-800 mb-1">No listings yet</p>
            <p className="text-xs text-zinc-500">Add your first parking space from the host dashboard</p>
          </div>
        ) : (
          <div className="space-y-2">
            {spaces.map((space) => {
              const isActive = space.is_active !== false && space.isActive !== false;
              const pricing = (space.pricing as Array<Record<string, unknown>>)?.[0];
              return (
                <div key={String(space.id)} className="p-4 bg-white rounded-3xl border border-zinc-150">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-sm text-zinc-950 truncate">{String(space.name)}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isActive ? "bg-[ethio-green]/10 text-[ethio-green]" : "bg-[ethio-red]/10 text-[ethio-red]"}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mb-1">{String(space.address)}</p>
                      <div className="flex gap-3 text-[10px] text-zinc-500">
                        <span>{String(space.total_spots || space.totalSpots || 0)} spots</span>
                        <span>{String(space.booking_count || space.bookingCount || 0)} bookings</span>
                        {pricing && <span className="font-bold text-[ethio-green]">ETB {String(pricing.price)}/{String(pricing.rate_type || pricing.rateType) === "hourly" ? "hr" : String(pricing.rate_type || pricing.rateType) === "daily" ? "day" : "mo"}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(space)} disabled={togglingId === String(space.id)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all border ${isActive ? "bg-[ethio-red]/5 border-[ethio-red]/20 text-[ethio-red] hover:bg-[ethio-red]/10" : "bg-[ethio-green]/5 border-[ethio-green]/20 text-[ethio-green] hover:bg-[ethio-green]/10"} disabled:opacity-50`}>
                      {togglingId === String(space.id) ? "..." : isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => deleteSpace(String(space.id))} disabled={deletingId === String(space.id)}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-white border border-[ethio-red]/20 text-[ethio-red] hover:bg-[ethio-red]/5 transition-all disabled:opacity-50">
                      {deletingId === String(space.id) ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
