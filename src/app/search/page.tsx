"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, setLocale, getLocale, Locale } from "@/lib/i18n";

export default function SearchPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => { setLocaleState(getLocale()); }, []);

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 9.0054, lng: 38.7636 })
      );
    } else {
      setUserLocation({ lat: 9.0054, lng: 38.7636 });
    }
  }, []);

  useEffect(() => { if (userLocation) loadSpaces(); }, [userLocation]);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parking?lat=${userLocation?.lat || 9.0054}&lng=${userLocation?.lng || 38.7636}&radius=10`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch {}
    setLoading(false);
  };

  const filtered = spaces.filter((s) => {
    const matchQuery = !query || s.name?.toLowerCase().includes(query.toLowerCase()) || s.address?.toLowerCase().includes(query.toLowerCase());
    let matchFilter = true;
    if (activeFilter === "covered") matchFilter = s.is_covered || s.isCovered;
    else if (activeFilter === "ev") matchFilter = s.is_ev_charger || s.isEvCharger;
    else if (activeFilter === "24_7") matchFilter = s.is_24_7 || s.is247;
    else if (activeFilter !== "all") matchFilter = (s.space_type || s.spaceType)?.toLowerCase() === activeFilter;
    return matchQuery && matchFilter;
  });

  const FILTERS = [
    { key: "all", label: "All" }, { key: "garage", label: "🏢 Garage" }, { key: "lot", label: "🅿 Lot" },
    { key: "driveway", label: "🏡 Driveway" }, { key: "covered", label: "Covered" }, { key: "ev", label: "⚡ EV" }, { key: "24_7", label: "24/7" },
  ];

  const spaceIcon = (type: string) => {
    if (!type) return "🅿";
    const tp = type.toLowerCase();
    if (tp === "garage") return "🏢";
    if (tp === "driveway") return "🏡";
    if (tp === "lot") return "🅿";
    if (tp === "street") return "🛣";
    return "🅿";
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#128a42] font-bold text-xs hover:underline">← {t("nav.home")}</Link>
            <div className="w-px h-4 bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-[#128a42] via-[#facc15] to-[#d92323] p-[1.5px] rounded-xl">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <span className="text-[10px]">🅿</span>
                </div>
              </div>
              <span className="font-display font-extrabold text-sm tracking-tight text-zinc-950">
                PARKme <span className="text-[#128a42]">Search</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => switchLocale(locale === "en" ? "am" : "en")}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-2xl text-xs font-bold transition-all border border-zinc-200"
              aria-label={locale === "en" ? "Switch to Amharic" : "Switch to English"}>
              {locale === "en" ? "🇪🇹 አማ" : "🇬🇧 EN"}
            </button>
            <Link href="/map" className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-2xl text-xs font-bold transition-all border border-zinc-200">
              🗺 {t("nav.map")}
            </Link>
            <Link href="/auth/login" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-xs font-bold transition-all">
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-4 flex flex-col flex-1">
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#128a42] focus:bg-white transition-all shadow-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                activeFilter === f.key
                  ? "bg-[#128a42] text-white shadow-sm"
                  : "bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
          <span className="font-semibold">
                {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" />
                {t("search.loading")}
              </span>
            ) : (
              <>{filtered.length} {t("search.spacesNearby")}</>
            )}
          </span>
        </div>

        {/* Results */}
        {filtered.length === 0 && !loading ? (
          <div className="bg-white border border-zinc-200 p-8 rounded-3xl text-center text-zinc-500 space-y-3">
            <div className="text-3xl">🚗</div>
            <p className="text-sm font-bold text-zinc-800 font-display">{t("search.noResults")}</p>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              {t("search.noResultsDesc")}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((space) => {
              const price = space.pricing?.[0];
              const rateLabel = price?.rate_type === "hourly" || price?.rateType === "HOURLY" ? "hr" : "day";
              const available = space.available_spots ?? space.availableSpots ?? "—";
              const total = space.total_spots ?? space.totalSpots ?? "—";
              return (
                <Link
                  key={space.id}
                  href={`/space/${space.id}`}
                  className="flex bg-white rounded-3xl border border-zinc-150 hover:border-[#128a42]/30 hover:shadow-md hover:shadow-[#128a42]/5 overflow-hidden gap-4 transition-all group"
                >
                  {/* Photo or icon */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-50 flex items-center justify-center flex-shrink-0 border-r border-zinc-100">
                    {space.primary_photo ? (
                      <img src={space.primary_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{spaceIcon(space.space_type || space.spaceType)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-3 pr-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#128a42] bg-[#128a42]/10 px-2 py-0.5 rounded-full border border-[#128a42]/20 uppercase">
                          {space.space_type || space.spaceType}
                        </span>
                        {space.rating_avg ? (
                          <span className="text-[11px] font-bold text-zinc-800">
                            <span className="text-[#facc15]">★</span> {Number(space.rating_avg).toFixed(1)}
                          </span>
                        ) : null}
                        {space.is_24_7 || space.is247 ? (
                          <span className="text-[9px] font-bold text-[#d92323] bg-[#d92323]/10 px-1.5 py-0.5 rounded-full">24/7</span>
                        ) : null}
                      </div>
                      <h3 className="font-display font-bold text-sm text-zinc-950 truncate group-hover:text-[#128a42] transition-colors">
                        {space.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 truncate">{space.address}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-[#128a42] text-base font-display">
                        ETB {price?.price || "—"}
                        <span className="text-[10px] text-zinc-400 font-normal font-sans">/{rateLabel}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 px-2 py-0.5 rounded-md">
                        {available}/{total} spots
                      </span>
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
