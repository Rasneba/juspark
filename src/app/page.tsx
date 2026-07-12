import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--primary)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "800", color: "white" }}>🅿 PARKme Ethiopia</h1>
        <Link href="/auth/login" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.15)", color: "white", borderRadius: "var(--radius)", fontWeight: "600", fontSize: "0.85rem" }}>Sign In</Link>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🅿</div>
        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "white", marginBottom: "0.75rem", lineHeight: 1.1 }}>
          Park Smarter<br />Across Ethiopia
        </h2>
        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", marginBottom: "2rem", maxWidth: "320px", lineHeight: 1.5 }}>
          Search, book, and pay for parking in Addis Ababa and beyond.
        </p>

        <Link href="/search" style={{ display: "block", width: "100%", maxWidth: "320px", padding: "1rem", background: "var(--accent)", color: "white", borderRadius: "var(--radius)", fontWeight: "700", fontSize: "1.1rem", textAlign: "center", marginBottom: "0.75rem" }}>
          🔍 Find Parking
        </Link>
        <Link href="/host" style={{ display: "block", width: "100%", maxWidth: "320px", padding: "1rem", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: "var(--radius)", fontWeight: "700", fontSize: "1.1rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)", marginBottom: "2rem" }}>
          💰 List Your Space
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", width: "100%", maxWidth: "320px" }}>
          {[
            { icon: "🔍", label: "Search" },
            { icon: "📱", label: "Book & Pay" },
            { icon: "💰", label: "Earn" },
          ].map((f) => (
            <div key={f.label} style={{ padding: "1rem 0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{f.icon}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>{f.label}</div>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
        &copy; 2026 PARKme Ethiopia
      </footer>
    </div>
  );
}
