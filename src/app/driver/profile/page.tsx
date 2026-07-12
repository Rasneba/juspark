"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DriverProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadBookings(token);
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const loadBookings = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("accessMode");
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">
        <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => !["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status));
  const pastBookings = bookings.filter((b) => ["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status));
  const totalSpent = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans select-none antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">
            ←
          </Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">My Profile</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-4 pb-16">
        {/* User card */}
        <div className="bg-white rounded-3xl border border-zinc-150 p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#128a42] to-[#0f7a39] flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg shadow-[#128a42]/20">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-base text-zinc-950">{user.name || "User"}</h2>
              <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
              {user.phone && <p className="text-[10px] text-zinc-400">{user.phone}</p>}
            </div>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#128a42]/10 text-[#128a42] border border-[#128a42]/20">
            🚗 Driver Account
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl border border-zinc-150 p-3 text-center shadow-sm">
            <div className="font-display font-extrabold text-base text-[#128a42]">{bookings.length}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Total</div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-150 p-3 text-center shadow-sm">
            <div className="font-display font-extrabold text-base text-[#128a42]">{activeBookings.length}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Active</div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-150 p-3 text-center shadow-sm">
            <div className="font-display font-extrabold text-base text-[#128a42]">ETB {totalSpent.toFixed(0)}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Spent</div>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-2 mb-6">
          {[
            { href: "/search", icon: "🔍", label: "Find Parking", desc: "Search nearby parking spaces" },
            { href: "/search/nearby", icon: "📍", label: "Nearby Search", desc: "Find spots closest to you" },
            { href: "/map", icon: "🗺", label: "Map View", desc: "Explore on the map" },
            { href: "/bookings", icon: "📋", label: "My Bookings", desc: `${activeBookings.length} active, ${pastBookings.length} past` },
            { href: "/host", icon: "🏠", label: "Switch to Host", desc: "Manage your parking spaces" },
          ].map((link) => (
            <Link key={link.href + link.label} href={link.href}
              className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-zinc-150 hover:border-[#128a42]/30 hover:shadow-md transition-all">
              <span className="text-base">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-xs text-zinc-950">{link.label}</div>
                <div className="text-[10px] text-zinc-500">{link.desc}</div>
              </div>
              <span className="text-zinc-400 text-xs">→</span>
            </Link>
          ))}
        </div>

        {/* Recent bookings */}
        {pastBookings.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-bold text-xs text-zinc-950 mb-2 uppercase tracking-wider">Recent Bookings</h3>
            {pastBookings.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-zinc-150 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-zinc-900 truncate">{b.space?.name || "Parking"}</div>
                  <div className="text-[10px] text-zinc-500">ETB {b.totalAmount || 0}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                  b.status === "COMPLETED" ? "bg-[#128a42]/10 text-[#128a42]" : "bg-[#d92323]/10 text-[#d92323]"
                }`}>
                  {b.status?.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleLogout}
          className="w-full py-3 bg-white border border-[#d92323]/30 text-[#d92323] rounded-2xl text-sm font-bold hover:bg-[#d92323]/5 transition-all">
          Log Out
        </button>
      </div>
    </div>
  );
}
