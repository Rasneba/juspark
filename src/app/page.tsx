import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--primary)" }}>JusPark</h1>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/search" style={{ padding: "0.5rem 1rem", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>Find Parking</Link>
          <Link href="/owner" style={{ padding: "0.5rem 1rem", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>List Your Space</Link>
          <Link href="/auth/login" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600" }}>Sign In</Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <section style={{ padding: "6rem 2rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "3rem", fontWeight: "800", color: "var(--primary)", marginBottom: "1rem", lineHeight: "1.1" }}>
            Find the Perfect Parking Spot
          </h2>
          <p style={{ fontSize: "1.25rem", color: "var(--muted-foreground)", marginBottom: "2rem" }}>
            Search, book, and pay for parking across Ethiopia. From airports to malls, we&apos;ve got you covered.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href="/search" style={{ padding: "1rem 2rem", background: "var(--secondary)", color: "var(--primary)", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "700", fontSize: "1.1rem" }}>
              Search Parking
            </Link>
            <Link href="/owner/listings/new" style={{ padding: "1rem 2rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "700", fontSize: "1.1rem" }}>
              List Your Space
            </Link>
          </div>
        </section>

        <section style={{ padding: "4rem 2rem", background: "var(--muted)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
            {[
              { icon: "🔍", title: "Search & Discover", desc: "Find parking near any location with real-time availability and pricing." },
              { icon: "📱", title: "Book & Pay Online", desc: "Reserve your spot instantly and pay securely with multiple payment options." },
              { icon: "💰", title: "List & Earn", desc: "Monetize your unused parking space. Set your prices and manage availability." },
            ].map((f) => (
              <div key={f.title} style={{ padding: "2rem", background: "white", borderRadius: "var(--radius)", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{f.icon}</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>{f.title}</h3>
                <p style={{ color: "var(--muted-foreground)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", textAlign: "center", marginBottom: "2rem" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
            {[
              { step: "1", title: "Search", desc: "Enter destination or browse nearby" },
              { step: "2", title: "Compare", desc: "View prices, reviews, amenities" },
              { step: "3", title: "Book", desc: "Select time and confirm booking" },
              { step: "4", title: "Park", desc: "Navigate and check in with QR code" },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center", padding: "1.5rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: "700", margin: "0 auto 1rem" }}>{s.step}</div>
                <h3 style={{ fontWeight: "700", marginBottom: "0.25rem" }}>{s.title}</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ padding: "2rem", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--muted-foreground)" }}>
        <p>&copy; 2026 JusPark. All rights reserved.</p>
      </footer>
    </div>
  );
}
