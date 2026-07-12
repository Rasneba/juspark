"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";
const GOOGLE_MAPS_KEY = "AIzaSyDhW7KIfOSP-lLduYFQokSKjwJx34iEDZ8";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export default function SpaceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [space, setSpace] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/juspark/spaces/${id}`);
        if (!res.ok) throw new Error("Space not found");
        const data = await res.json();
        setSpace(data);

        try {
          const revRes = await apiFetch(`/api/juspark/spaces/${id}/reviews`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(Array.isArray(revData) ? revData : []);
          }
        } catch { }
      } catch (e: any) {
        setError(e.message || "Failed to load parking space");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "6rem 2rem", color: "var(--muted-foreground)" }}>
          <p style={{ fontSize: "1.125rem" }}>Loading parking space...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--primary)", marginBottom: "0.5rem" }}>
            {error || "Space not found"}
          </p>
          <Link href="/search" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "underline" }}>
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const pricing = Array.isArray(space.pricing) ? space.pricing : [];
  const hourly = pricing.find((p: any) => p.rate_type === "hourly" || p.rateType === "hourly");
  const daily = pricing.find((p: any) => p.rate_type === "daily" || p.rateType === "daily");
  const monthly = pricing.find((p: any) => p.rate_type === "monthly" || p.rateType === "monthly");

  const lat = space.latitude || space.lat || 9.0054;
  const lng = space.longitude || space.lng || 38.7636;
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${lat},${lng}&zoom=16`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <Header />

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem 2rem 4rem" }}>
        <Link href="/search" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", marginBottom: "1.5rem" }}>
          ← Back to Search
        </Link>

        <div style={{ background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ height: "320px", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {space.primary_photo ? (
              <img src={space.primary_photo} alt={space.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "4rem", color: "var(--muted-foreground)" }}>🅿</span>
            )}
          </div>

          <div style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ padding: "0.25rem 0.75rem", background: "#EEF4FF", color: "var(--accent)", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600", textTransform: "capitalize" }}>
                  {space.space_type || space.spaceType}
                </span>
                {(space.rating_avg || space.ratingAvg) && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem", fontWeight: "600" }}>
                    ★ {Number(space.rating_avg || space.ratingAvg).toFixed(1)}
                    {space.review_count || space.reviewCount ? (
                      <span style={{ fontWeight: "400", color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
                        ({space.review_count || space.reviewCount} reviews)
                      </span>
                    ) : null}
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", fontWeight: "500" }}>
                {space.available_spots ?? space.availableSpots ?? "—"} / {space.total_spots ?? space.totalSpots ?? "—"} spots available
              </span>
            </div>

            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "0.375rem" }}>{space.name}</h1>
            <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>{space.address}</p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {(space.is_covered || space.isCovered) && (
                <span style={{ padding: "0.375rem 0.75rem", background: "#EEF4FF", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "500", color: "var(--accent)" }}>☂ Covered</span>
              )}
              {(space.is_ev_charger || space.isEvCharger) && (
                <span style={{ padding: "0.375rem 0.75rem", background: "#ECFDF5", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "500", color: "#059669" }}>⚡ EV Charging</span>
              )}
              {(space.is_24_7 || space.is247) && (
                <span style={{ padding: "0.375rem 0.75rem", background: "#FEF3C7", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "500", color: "#D97706" }}>🕐 24/7 Access</span>
              )}
            </div>

            {space.description && (
              <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", lineHeight: "1.6", marginBottom: "1.5rem" }}>{space.description}</p>
            )}

            {(space.host_name || space.hostName || space.host) && (
              <div style={{ padding: "0.75rem 1rem", background: "var(--muted)", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
                <span style={{ fontWeight: "600" }}>Hosted by </span>
                {space.host_name || space.hostName || space.host?.name || "Host"}
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "0.75rem" }}>Pricing</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {[
                  { label: "Hourly", data: hourly, icon: "⏱" },
                  { label: "Daily", data: daily, icon: "📅" },
                  { label: "Monthly", data: monthly, icon: "📆" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{item.icon}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>{item.label}</div>
                    <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>
                      {item.data ? `ETB ${item.data.price}` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/book?spaceId=${space.id}`}
              style={{
                display: "block",
                width: "100%",
                padding: "1rem",
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius)",
                fontSize: "1.1rem",
                fontWeight: "700",
                textAlign: "center",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Book Now
            </Link>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginTop: "1.5rem", overflow: "hidden" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>Location</h2>
          <iframe
            title="Parking Location"
            width="100%"
            height="350"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc}
          />
        </div>

        <div style={{ background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginTop: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem" }}>Reviews</h2>
          {reviews.length === 0 ? (
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>No reviews yet. Be the first to book and review this space!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviews.map((review: any, i: number) => (
                <div key={review.id || i} style={{ padding: "1rem", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>{review.user_name || review.userName || "Anonymous"}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>★ {review.rating}</span>
                  </div>
                  {review.comment && (
                    <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", margin: 0 }}>{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header style={{ padding: "1rem 2rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)", textDecoration: "none" }}>PARKme Ethiopia</Link>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link href="/search" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>Search</Link>
        <Link href="/host" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Host</Link>
        <Link href="/auth/login" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>Sign In</Link>
      </nav>
    </header>
  );
}
