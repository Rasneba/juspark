"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers as Record<string, string> };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export default function HostListingsPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = "/auth/login"; return; }
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/owner/listings");
      if (res.ok) {
        const data = await res.json();
        setSpaces(data.spaces || []);
      }
    } catch { }
    setLoading(false);
  };

  const toggleActive = async (space: any) => {
    const id = space.id;
    const isActive = space.is_active !== false && space.isActive !== false;
    setTogglingId(id);
    try {
      await apiFetch(`/api/parking/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: isActive ? "INACTIVE" : "ACTIVE" }),
      });
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, is_active: !isActive, isActive: !isActive } : s
        )
      );
    } catch { }
    setTogglingId(null);
  };

  const deleteSpace = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this space? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/parking/${id}`, { method: "DELETE" });
      if (res.ok) setSpaces((prev) => prev.filter((s) => s.id !== id));
    } catch { }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans select-none antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/host" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">
            ←
          </Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">My Listings</span>
          <Link href="/host/add" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-xs font-bold transition-all">
            + Add
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        <p className="text-xs text-zinc-500 font-bold mb-3">{spaces.length} total spaces</p>

        {loading ? (
          <div className="text-center py-12 text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" />
            Loading listings...
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-zinc-200">
            <div className="text-3xl mb-2">🅿</div>
            <p className="font-display font-bold text-sm text-zinc-800 mb-1">No listings yet</p>
            <p className="text-xs text-zinc-500 mb-4">Add your first parking space to get started</p>
            <Link href="/host/add" className="inline-block px-6 py-2.5 bg-[#128a42] text-white rounded-2xl text-xs font-bold hover:bg-[#0f7a39] transition-all">
              + Add Space
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {spaces.map((space) => {
              const isActive = space.is_active !== false && space.isActive !== false;
              const price = space.pricing?.[0];
              return (
                <div key={space.id} className="p-4 bg-white rounded-3xl border border-zinc-150">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-sm text-zinc-950 truncate">{space.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive ? "bg-[#128a42]/10 text-[#128a42]" : "bg-[#d92323]/10 text-[#d92323]"
                        }`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mb-1">{space.address}</p>
                      <div className="flex gap-3 text-[10px] text-zinc-500">
                        <span>{space.total_spots || space.totalSpots || 0} spots</span>
                        <span>{space.booking_count || space.bookingCount || 0} bookings</span>
                        {price && <span className="font-bold text-[#128a42]">ETB {price.price}/{price.rate_type === "hourly" ? "hr" : price.rate_type === "daily" ? "day" : "mo"}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(space)}
                      disabled={togglingId === space.id}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                        isActive
                          ? "bg-[#d92323]/5 border-[#d92323]/20 text-[#d92323] hover:bg-[#d92323]/10"
                          : "bg-[#128a42]/5 border-[#128a42]/20 text-[#128a42] hover:bg-[#128a42]/10"
                      } disabled:opacity-50`}
                    >
                      {togglingId === space.id ? "..." : isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteSpace(space.id)}
                      disabled={deletingId === space.id}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-white border border-[#d92323]/20 text-[#d92323] hover:bg-[#d92323]/5 transition-all disabled:opacity-50"
                    >
                      {deletingId === space.id ? "..." : "Delete"}
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
