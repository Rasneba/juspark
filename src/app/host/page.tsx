"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ETHIOPIAN_HOLIDAYS } from "@/lib/holidays";
import { t, setLocale, getLocale, Locale } from "@/lib/i18n";

export default function HostDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [spaces, setSpaces] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocaleState] = useState<Locale>("en");
  const [blockedHolidays, setBlockedHolidays] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocaleState(getLocale());
    if (!api.checkAuth()) { window.location.href = "/auth/login"; return; }
    loadData();
    loadBlockedHolidays();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, spacesRes] = await Promise.all([
        api.get("/api/owner/dashboard"),
        api.get("/api/owner/listings"),
      ]);
      if (dashRes.ok) setStats(await dashRes.json());
      if (spacesRes.ok) {
        const data = await spacesRes.json();
        setSpaces(data.spaces || []);
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  const loadBlockedHolidays = () => {
    try {
      const stored = localStorage.getItem("parkme_blocked_holidays");
      if (stored) setBlockedHolidays(new Set(JSON.parse(stored)));
    } catch { /* empty */ }
  };

  const toggleHolidayBlock = (holidayId: string) => {
    setBlockedHolidays((prev) => {
      const next = new Set(prev);
      if (next.has(holidayId)) next.delete(holidayId);
      else next.add(holidayId);
      localStorage.setItem("parkme_blocked_holidays", JSON.stringify([...next]));
      return next;
    });
  };

  const blockAll = () => {
    const all = new Set(ETHIOPIAN_HOLIDAYS.map((h) => h.id));
    setBlockedHolidays(all);
    localStorage.setItem("parkme_blocked_holidays", JSON.stringify([...all]));
  };

  const unblockAll = () => {
    setBlockedHolidays(new Set());
    localStorage.setItem("parkme_blocked_holidays", JSON.stringify([]));
  };

  const switchLocale = (l: Locale) => { setLocale(l); setLocaleState(l); };

  const currentYear = new Date().getFullYear();
  const statCards = [
    { label: t("host.totalEarnings"), value: `ETB ${stats?.total_earnings || stats?.totalEarnings || 0}`, icon: "💰", color: "#128a42" },
    { label: t("host.pendingPayout"), value: `ETB ${stats?.pending_payout || stats?.pendingPayout || 0}`, icon: "⏳", color: "#facc15" },
    { label: t("host.totalBookings"), value: String(stats?.total_bookings || stats?.totalBookings || 0), icon: "📋", color: "#128a42" },
    { label: t("host.avgRating"), value: String(stats?.average_rating || stats?.averageRating || "—"), icon: "⭐", color: "#facc15" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-r from-[#128a42] via-[#facc15] to-[#d92323] p-[1.5px] rounded-xl">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center"><span className="text-[10px]">🅿</span></div>
            </div>
            <span className="font-display font-extrabold text-sm tracking-tight text-zinc-950">
              PARKme <span className="text-[#128a42]">{locale === "am" ? "እንቋቋ" : "Host"}</span>
            </span>
          </Link>
          <span className="flex-1" />
          <button onClick={() => switchLocale(locale === "en" ? "am" : "en")}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-2xl text-xs font-bold transition-all border border-zinc-200"
            aria-label={locale === "en" ? "Switch to Amharic" : "Switch to English"}>
            {locale === "en" ? "🇪🇹 አማ" : "🇬🇧 EN"}
          </button>
          <Link href="/profile" className="px-3 py-1.5 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl text-xs font-bold transition-all">Profile</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        <h1 className="font-display font-extrabold text-lg text-[#128a42] mb-4">{t("host.title")}</h1>

        {loading ? (
          <div className="text-center py-12 text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#128a42] border-t-transparent rounded-full animate-spin" /> {t("common.loading")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {statCards.map((card) => (
                <div key={card.label} className="p-4 bg-white rounded-3xl border border-zinc-150">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{card.label}</span>
                    <span className="text-sm">{card.icon}</span>
                  </div>
                  <div className="font-display font-extrabold text-base" style={{ color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Holiday Blocking */}
            <div className="bg-white rounded-3xl border border-zinc-150 p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-display font-bold text-sm text-zinc-950">{t("holiday.title")}</h2>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{t("holiday.subtitle")}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={blockAll} className="px-3 py-1.5 bg-[#d92323]/5 border border-[#d92323]/20 text-[#d92323] rounded-xl text-[10px] font-bold hover:bg-[#d92323]/10 transition-all">{t("host.blockAll")}</button>
                  <button onClick={unblockAll} className="px-3 py-1.5 bg-[#128a42]/5 border border-[#128a42]/20 text-[#128a42] rounded-xl text-[10px] font-bold hover:bg-[#128a42]/10 transition-all">{t("host.unblockAll")}</button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 mb-4 leading-relaxed">{t("holiday.description")}</p>

              <div className="space-y-2">
                {ETHIOPIAN_HOLIDAYS.map((holiday) => {
                  const isBlocked = blockedHolidays.has(holiday.id);
                  const holidayDate = new Date(currentYear, holiday.month - 1, holiday.day);
                  const isPast = holidayDate < new Date();
                  const displayDate = isPast ? new Date(currentYear + 1, holiday.month - 1, holiday.day) : holidayDate;
                  const dateStr = displayDate.toLocaleDateString(locale === "am" ? "am-ET" : "en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={holiday.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isBlocked ? "bg-[#d92323]/5 border-[#d92323]/20" : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"}`}>
                      <span className="text-xl">{holiday.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-xs text-zinc-950">{locale === "am" ? holiday.nameAm : holiday.nameEn}</span>
                          {isBlocked && <span className="px-1.5 py-0.5 bg-[#d92323]/10 text-[#d92323] text-[8px] font-bold rounded-full uppercase">{t("host.blocked")}</span>}
                        </div>
                        <div className="text-[10px] text-zinc-500">{dateStr} · {locale === "am" ? holiday.descriptionAm.slice(0, 50) : holiday.descriptionEn.slice(0, 60)}</div>
                      </div>
                      <button onClick={() => toggleHolidayBlock(holiday.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${isBlocked ? "bg-[#d92323]/10 border-[#d92323]/30 text-[#d92323] hover:bg-[#d92323]/15" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                        aria-label={isBlocked ? `${t("host.unblock")} ${holiday.nameEn}` : `${t("host.block")} ${holiday.nameEn}`}
                        aria-pressed={isBlocked}>
                        {isBlocked ? t("host.unblock") : t("host.block")}
                      </button>
                    </div>
                  );
                })}
              </div>

              {blockedHolidays.size > 0 && (
                <div className="mt-3 p-3 bg-[#d92323]/5 rounded-2xl border border-[#d92323]/10">
                  <p className="text-[10px] font-bold text-[#d92323]">{blockedHolidays.size} {locale === "am" ? "በዓላት ተገድበዋል" : "holiday(s) blocked"}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{locale === "am" ? "ቦታ ማስያዣዎች በእነዚህ ቀኖች አይገዙም" : "Bookings will be disabled on these dates"}</p>
                </div>
              )}
            </div>

            {/* Your Spaces */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display font-bold text-sm text-zinc-950">{t("host.yourSpaces")}</h2>
              <Link href="/host/listings" className="text-[11px] text-[#128a42] font-bold hover:underline">{t("host.manage")}</Link>
            </div>

            {spaces.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-3xl border border-zinc-200">
                <div className="text-2xl mb-2">🅿</div>
                <p className="font-display font-bold text-sm text-zinc-800 mb-1">{t("host.noSpaces")}</p>
                <p className="text-xs text-zinc-500 mb-3">{t("host.noSpacesDesc")}</p>
                <Link href="/host/listings" className="inline-block px-5 py-2 bg-[#128a42] text-white rounded-2xl text-xs font-bold hover:bg-[#0f7a39] transition-all">{t("host.addSpace")}</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <Link key={String(space.id)} href={`/space/${space.id}`}
                    className="flex items-center justify-between p-4 bg-white rounded-3xl border border-zinc-150 hover:border-[#128a42]/30 hover:shadow-md transition-all">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-sm text-zinc-950 truncate">{String(space.name)}</h3>
                      <p className="text-[11px] text-zinc-500 truncate">{String(space.address)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-[10px] text-zinc-500">{String(space.booking_count || space.bookingCount || 0)} bookings</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${(space.is_active !== false && space.isActive !== false) ? "bg-[#128a42]/10 text-[#128a42]" : "bg-[#d92323]/10 text-[#d92323]"}`}>
                        {(space.is_active !== false && space.isActive !== false) ? t("listings.active") : t("listings.inactive")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
