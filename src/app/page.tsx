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
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-zinc-400 hover:text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all">
            Sign In
          </Link>
          <Link href="/auth/register" className="bg-[#128a42] hover:bg-[#0f7a39] text-white px-5 py-2 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-[#128a42]/20 active:scale-95">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-10 pb-16">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#128a42] via-[#facc15] to-[#d92323] p-[2px] mb-8 shadow-2xl shadow-[#128a42]/20">
          <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center">
            <span className="text-3xl">🅿</span>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-4 tracking-tight">
          Park Smarter<br />
          <span className="text-[#128a42]">Across Ethiopia</span>
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">
          Search, book, and pay for parking in Addis Ababa and beyond.
          Instant booking, real-time availability, secure payments.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <Link href="/search" className="block w-full py-4 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl font-black text-base text-center transition-all shadow-xl shadow-[#128a42]/20 active:scale-[0.98]">
            🔍 Find Parking Near You
          </Link>
          <Link href="/host" className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-base text-center border border-white/10 transition-all active:scale-[0.98]">
            💰 List Your Space & Earn
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 bg-zinc-900/50 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "20+", label: "Parking Spots", icon: "🏢" },
            { num: "5,000+", label: "Happy Drivers", icon: "🚗" },
            { num: "Addis Ababa", label: "City Coverage", icon: "📍" },
            { num: "24/7", label: "Available", icon: "⏰" },
          ].map((s) => (
            <div key={s.label} className="space-y-2">
              <div className="text-2xl">{s.icon}</div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#128a42]">{s.num}</div>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-3">
            How It <span className="text-[#128a42]">Works</span>
          </h2>
          <p className="text-zinc-500 text-sm">Three simple steps to stress-free parking</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "1", icon: "🔍", title: "Search", desc: "Find nearby parking spots on an interactive map with real-time availability and pricing.", color: "#128a42" },
            { step: "2", icon: "📱", title: "Book & Pay", desc: "Reserve your spot instantly and pay securely via TeleBirr, CBE Birr, or card.", color: "#facc15" },
            { step: "3", icon: "✅", title: "Park & Go", desc: "Drive to your reserved spot. Show your booking confirmation and park worry-free.", color: "#d92323" },
          ].map((s) => (
            <div key={s.step} className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center space-y-4 hover:border-white/20 transition-all">
              <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: s.color + "15" }}>
                {s.icon}
              </div>
              <div className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: s.color }}>
                Step {s.step}
              </div>
              <h3 className="font-display font-extrabold text-lg text-white">{s.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Locations */}
      <section className="px-6 py-20 bg-zinc-900/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-3">
            Popular <span className="text-[#facc15]">Locations</span>
          </h2>
          <p className="text-zinc-500 text-sm">Find parking across Addis Ababa&apos;s busiest areas</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: "Bole", icon: "✈️", count: "8 spots" },
            { name: "Meskel Square", icon: "🏛️", count: "5 spots" },
            { name: "Merkato", icon: "🛒", count: "4 spots" },
            { name: "Piassa", icon: "🏪", count: "3 spots" },
          ].map((loc) => (
            <Link key={loc.name} href="/search" className="p-5 bg-white/5 rounded-3xl border border-white/10 text-center hover:bg-white/10 hover:border-white/20 transition-all group">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{loc.icon}</div>
              <div className="font-bold text-white text-sm">{loc.name}</div>
              <div className="text-[10px] text-zinc-500 font-bold mt-1">{loc.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-3">
            Why <span className="text-[#d92323]">PARKme</span>?
          </h2>
          <p className="text-zinc-500 text-sm">Everything you need for seamless parking</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🗺️", title: "Interactive Map", desc: "GPS-based map with satellite view, nearby POIs, and one-tap directions." },
            { icon: "⚡", title: "Instant Booking", desc: "Book and confirm your parking spot in under 10 seconds." },
            { icon: "💳", title: "Flexible Payment", desc: "Pay with TeleBirr, CBE Birr, or credit/debit card." },
            { icon: "🔒", title: "Secure Spaces", desc: "CCTV-monitored locations with verified hosts and ratings." },
            { icon: "📱", title: "Mobile Friendly", desc: "Install as an app on your phone — works offline too." },
            { icon: "💰", title: "Earn as Host", desc: "List your unused parking space and earn passive income." },
          ].map((f) => (
            <div key={f.title} className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Host CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-[#128a42]/10 via-transparent to-[#facc15]/5 border-y border-white/5">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="text-4xl">🏠</div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
            Own a Parking Space?<br />
            <span className="text-[#128a42]">Start Earning Today</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
            List your garage, driveway, or rooftop space on PARKme Ethiopia.
            Set your own prices, manage availability, and earn money from unused spaces.
          </p>
          <Link href="/host" className="inline-block px-8 py-4 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl font-black text-base transition-all shadow-xl shadow-[#128a42]/20 active:scale-[0.98]">
            💰 Become a Host
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-4">
          Ready to Park Smarter?
        </h2>
        <p className="text-zinc-500 text-sm mb-8">Join thousands of drivers across Addis Ababa</p>
        <div className="w-full max-w-sm mx-auto space-y-3">
          <Link href="/auth/register" className="block w-full py-4 bg-[#128a42] hover:bg-[#0f7a39] text-white rounded-2xl font-black text-base text-center transition-all shadow-xl shadow-[#128a42]/20 active:scale-[0.98]">
            Create Free Account
          </Link>
          <Link href="/search" className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-base text-center border border-white/10 transition-all active:scale-[0.98]">
            Browse as Guest →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-display font-extrabold text-sm text-white mb-3">
                PARKme <span className="text-[#128a42]">Ethiopia</span>
              </div>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Ethiopia&apos;s smartest parking platform. Find, book, and pay for parking in seconds.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/search" className="block text-zinc-500 hover:text-white text-xs transition-colors">Find Parking</Link>
                <Link href="/host" className="block text-zinc-500 hover:text-white text-xs transition-colors">Become a Host</Link>
                <Link href="/map" className="block text-zinc-500 hover:text-white text-xs transition-colors">View Map</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider mb-3">Account</h4>
              <div className="space-y-2">
                <Link href="/auth/login" className="block text-zinc-500 hover:text-white text-xs transition-colors">Sign In</Link>
                <Link href="/auth/register" className="block text-zinc-500 hover:text-white text-xs transition-colors">Register</Link>
                <Link href="/profile" className="block text-zinc-500 hover:text-white text-xs transition-colors">Profile</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider mb-3">Support</h4>
              <div className="space-y-2">
                <span className="block text-zinc-500 text-xs">support@parkme.et</span>
                <span className="block text-zinc-500 text-xs">+251 911 234 567</span>
                <span className="block text-zinc-500 text-xs">Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-zinc-600 text-xs">&copy; 2026 PARKme Ethiopia. All rights reserved.</span>
            <span className="text-zinc-600 text-xs">Made with 🇪🇹 in Addis Ababa</span>
          </div>
        </div>
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
