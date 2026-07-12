"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_BASE = "";

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
  const [mapSatellite, setMapSatellite] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/parking/${id}`);
        if (!res.ok) throw new Error("Space not found");
        const data = await res.json();
        setSpace(data.space || data);

        try {
          const revRes = await apiFetch(`/api/reviews?spaceId=${id}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(revData.reviews || []);
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
  const mapStreetSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapSatSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=satellite&marker=${lat}%2C${lng}`;
  const photos = space.images?.length > 0 ? space.images : (space.primary_photo ? [{ url: space.primary_photo, isPrimary: true }] : []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <Header />

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem 2rem 4rem" }}>
        <Link href="/search" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", marginBottom: "1.5rem" }}>
          ← Back to Search
        </Link>

        <div style={{ background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ height: "320px", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {photos.length > 0 ? (
              <>
                <img src={photos[activePhoto]?.url || photos[0]?.url} alt={space.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {photos.length > 1 && (
                  <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", background: "rgba(0,0,0,0.5)", borderRadius: 999, padding: "4px 8px" }}>
                    {photos.map((_: any, i: number) => (
                      <button key={i} onClick={() => setActivePhoto(i)} style={{ width: activePhoto === i ? 20 : 8, height: 8, borderRadius: 999, border: "none", background: activePhoto === i ? "white" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
                    ))}
                  </div>
                )}
                {photos.length > 1 && (
                  <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 8, padding: "2px 8px", fontSize: "0.7rem", fontWeight: "600" }}>
                    {activePhoto + 1}/{photos.length} photos
                  </div>
                )}
              </>
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

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link
                href={`/book/${space.id}`}
                style={{
                  flex: 1,
                  display: "block",
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
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener"
                style={{
                  padding: "1rem 1.25rem",
                  background: "#4A90D9",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                🧭
              </a>
            </div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginTop: "1.5rem", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "700" }}>Location</h2>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button onClick={() => setMapSatellite(false)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: `1px solid ${!mapSatellite ? "#1B1B1B" : "#d1d5db"}`, background: !mapSatellite ? "#1B1B1B" : "white", color: !mapSatellite ? "white" : "#6b7280", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer" }}>🗺 Streets</button>
              <button onClick={() => setMapSatellite(true)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: `1px solid ${mapSatellite ? "#4A90D9" : "#d1d5db"}`, background: mapSatellite ? "#EEF4FF" : "white", color: mapSatellite ? "#4A90D9" : "#6b7280", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer" }}>🛰 Satellite</button>
            </div>
          </div>
          <iframe
            title="Parking Location"
            width="100%"
            height="350"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSatellite ? mapSatSrc : mapStreetSrc}
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
    <header style={{ padding: "0.75rem 1rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <Link href="/search" style={{ padding: "0.4rem 0.6rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "1.1rem" }}>←</Link>
      <span style={{ fontSize: "0.95rem", fontWeight: "700", flex: 1 }}>🅿 PARKme Ethiopia</span>
      <Link href="/auth/login" style={{ padding: "0.35rem 0.7rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "600" }}>Sign In</Link>
    </header>
  );
}
