"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [mode, setMode] = useState<"driver" | "host">("driver");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { window.location.href = "/auth/login"; return; }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role === "host") setMode("host");
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("accessMode");
    window.location.href = "/";
  };

  const toggleMode = (newMode: "driver" | "host") => {
    setMode(newMode);
    if (user) {
      const updated = { ...user, role: newMode };
      localStorage.setItem("user", JSON.stringify(updated));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        <span className="w-5 h-5 border-2 border-[ethio-green] border-t-transparent rounded-full animate-spin mr-2" /> Loading...
      </div>
    );
  }

  const links = mode === "host"
    ? [
        { href: "/host", label: "Host Dashboard", desc: "View earnings and stats", icon: "📊" },
        { href: "/host/listings", label: "My Listings", desc: "Manage your parking spaces", icon: "📋" },
        { href: "/bookings", label: "My Bookings", desc: "View your bookings", icon: "🕐" },
      ]
    : [
        { href: "/bookings", label: "My Bookings", desc: "View active and past bookings", icon: "📋" },
        { href: "/search", label: "Find Parking", desc: "Search nearby spaces", icon: "🔍" },
        { href: "/map", label: "Map View", desc: "Explore on the map", icon: "🗺" },
      ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 transition-all text-sm font-bold">←</Link>
          <span className="font-display font-bold text-sm text-zinc-950 flex-1">Profile</span>
          <Link href="/search" className="px-3 py-1.5 bg-[ethio-green] hover:bg-[ethio-green] text-white rounded-2xl text-xs font-bold transition-all">Search</Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-4 flex-1">
        <h1 className="font-display font-extrabold text-lg text-[ethio-green] mb-4">My Profile</h1>

        <div className="p-5 bg-white rounded-3xl border border-zinc-150 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[ethio-green] to-[ethio-green] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {(String(user.name || user.email || "?")[0] || "?").toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-zinc-950">{String(user.name || "User")}</h2>
              <p className="text-[11px] text-zinc-500">{String(user.email)}</p>
            </div>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold capitalize"
            style={{ background: mode === "host" ? "ethio-green10" : "ethio-green08", color: "ethio-green", border: "1px solid ethio-green20" }}>
            {mode} Mode
          </span>
        </div>

        <div className="flex gap-1.5 mb-4 p-1 bg-zinc-100 rounded-2xl">
          <button onClick={() => toggleMode("driver")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === "driver" ? "bg-[ethio-green] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}>
            🚗 Driver Mode
          </button>
          <button onClick={() => toggleMode("host")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === "host" ? "bg-[ethio-green] text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}>
            🏠 Host Mode
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href}
              className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-zinc-150 hover:border-[ethio-green]/30 hover:shadow-md transition-all">
              <span className="text-lg">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm text-zinc-950">{link.label}</div>
                <div className="text-[11px] text-zinc-500">{link.desc}</div>
              </div>
              <span className="text-zinc-400 text-sm">→</span>
            </Link>
          ))}
        </div>

        <button onClick={handleLogout}
          className="w-full py-3 bg-white border border-[ethio-red]/30 text-[ethio-red] rounded-2xl text-sm font-bold hover:bg-[ethio-red]/5 transition-all">
          Log Out
        </button>
      </div>
    </div>
  );
}
