import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none overflow-x-hidden antialiased">
      {/* Ethiopian tri-color top accent bar */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#128a42]" />
        <div className="flex-1 bg-[#facc15]" />
        <div className="flex-1 bg-[#d92323]" />
      </div>

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-default">
          <div className="w-10 h-10 bg-gradient-to-r from-[#128a42] via-[#facc15] to-[#d92323] p-[2px] rounded-2xl shadow-lg">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <span className="text-sm font-black">🅿</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-lg tracking-tighter text-white">
              PARKme <span className="text-[#128a42]">Ethiopia</span>
            </span>
            <span className="text-[9px] font-bold tracking-wider text-[#128a42] uppercase -mt-0.5">
              ፓርክም · ኢትዮጵያ
            </span>
          </div>
        </div>
        <Link href="/auth/login" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-2xl text-xs font-bold transition-all border border-white/10 hover:border-white/20 active:scale-95">
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#128a42] via-[#facc15] to-[#d92323] p-[2px] mb-8 shadow-2xl shadow-[#128a42]/20">
          <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center">
            <span className="text-3xl">🅿</span>
          </div>
        </div>

        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.05] mb-4 tracking-tight">
          Park Smarter<br />
          <span className="text-[#128a42]">Across Ethiopia</span>
        </h2>
        <p className="text-zinc-400 text-base max-w-sm mb-10 leading-relaxed">
          Search, book, and pay for parking in Addis Ababa and beyond. Instant booking, real-time availability.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <Link href="/search" className="block w-full py-4 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl font-black text-base text-center transition-all shadow-xl shadow-[#128a42]/20 active:scale-[0.98]">
            🔍 Find Parking
          </Link>
          <Link href="/host" className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-base text-center border border-white/10 transition-all active:scale-[0.98]">
            💰 List Your Space
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-10">
          {[
            { icon: "🔍", label: "Search", desc: "Nearby spots" },
            { icon: "📱", label: "Book & Pay", desc: "Instant confirm" },
            { icon: "💰", label: "Earn", desc: "List your space" },
          ].map((f) => (
            <div key={f.label} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-xs font-bold text-white mb-0.5">{f.label}</div>
              <div className="text-[10px] text-zinc-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-zinc-600 text-xs">
        &copy; 2026 PARKme Ethiopia &middot; Made with 🇪🇹
      </footer>

      {/* Bottom tri-color accent bar */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#128a42]" />
        <div className="flex-1 bg-[#facc15]" />
        <div className="flex-1 bg-[#d92323]" />
      </div>
    </div>
  );
}
