"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://juspark-api-ephrem-awulachews-projects.vercel.app";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    __mapLoadPromise?: Promise<void>;
  }
}

interface ParkingSpace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  pricing?: { price: number; rate_type: string }[];
  total_spots?: number;
  available_spots?: number;
  space_type?: string;
}

const DEFAULT_CENTER = { lat: 9.0054, lng: 38.7636 };

function getMarkerPrice(space: ParkingSpace): string {
  const price = space.pricing?.[0];
  if (!price) return "";
  return `ETB ${price.price}`;
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [query, setQuery] = useState("");
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapReady, setMapReady] = useState(false);

  const loadGoogleMaps = useCallback((): Promise<void> => {
    if (window.__mapLoadPromise) return window.__mapLoadPromise;
    window.__mapLoadPromise = new Promise((resolve) => {
      window.initMap = () => resolve();
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDhW7KIfOSP-lLduYFQokSKjwJx34iEDZ8&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
    return window.__mapLoadPromise;
  }, []);

  const fetchSpaces = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/juspark/spaces?lat=${lat}&lng=${lng}&radius=10`);
      const data = await res.json();
      setSpaces(Array.isArray(data) ? data : []);
    } catch {
      setSpaces([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await loadGoogleMaps();
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      map.addListener("dragstart", () => setShowSearchArea(false));
      map.addListener("idle", () => {
        const c = map.getCenter();
        setMapCenter({ lat: c.lat(), lng: c.lng() });
        setShowSearchArea(true);
      });

      window.google.maps.event.trigger(map, "idle");
      setMapReady(true);
    };

    init();
    return () => { cancelled = true; };
  }, [loadGoogleMaps]);

  useEffect(() => {
    fetchSpaces(mapCenter.lat, mapCenter.lng);
  }, [mapCenter, fetchSpaces]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    spaces.forEach((space) => {
      const marker = new window.google.maps.Marker({
        position: { lat: space.lat, lng: space.lng },
        map: mapInstanceRef.current,
        label: {
          text: getMarkerPrice(space),
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
          fontFamily: "system-ui, sans-serif",
        },
        icon: {
          path: window.google.maps.SymbolPath.ROUNDED_RECTANGLE,
          scale: 28,
          fillColor: "#1B1B1B",
          fillOpacity: 0.92,
          strokeColor: "#4A90D9",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        const price = space.pricing?.[0];
        const priceLabel = price ? `ETB ${price.price}/${price.rate_type === "hourly" ? "hr" : price.rate_type === "daily" ? "day" : "mo"}` : "Price TBD";
        infoWindowRef.current.setContent(`
          <div style="padding:8px 4px;max-width:240px;font-family:system-ui,sans-serif">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#1B1B1B">${space.name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:6px">${space.address}</div>
            <div style="font-size:14px;font-weight:700;color:#4A90D9;margin-bottom:4px">${priceLabel}</div>
            ${space.available_spots != null ? `<div style="font-size:11px;color:#888;margin-bottom:8px">${space.available_spots}/${space.total_spots} spots available</div>` : ""}
            <a href="/space/${space.id}" style="display:inline-block;background:#1B1B1B;color:#fff;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">View Details</a>
          </div>
        `);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [spaces, mapReady]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapReady || !window.google || !query.trim()) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query + ", Addis Ababa, Ethiopia" }, (results: any, status: any) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        mapInstanceRef.current.panTo(loc);
        mapInstanceRef.current.setZoom(15);
        setMapCenter({ lat: loc.lat(), lng: loc.lng() });
        setShowSearchArea(false);
      }
    });
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapInstanceRef.current?.panTo(loc);
        mapInstanceRef.current?.setZoom(15);
        setMapCenter(loc);
        setShowSearchArea(false);
      },
      () => {}
    );
  };

  const handleSearchThisArea = () => {
    const c = mapInstanceRef.current?.getCenter();
    if (!c) return;
    setMapCenter({ lat: c.lat(), lng: c.lng() });
    setShowSearchArea(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "1rem 2rem", background: "white", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 30, flexShrink: 0 }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)", textDecoration: "none" }}>PARKme Ethiopia</Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/search" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Search</Link>
          <Link href="/host" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Host</Link>
          <Link href="/auth/login" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>Sign In</Link>
        </nav>
      </header>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "0.75rem 2rem", display: "flex", gap: "0.5rem", zIndex: 20, flexShrink: 0 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a location to find nearby parking..."
          style={{ flex: 1, padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", outline: "none" }}
        />
        <button type="submit" style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: "600", cursor: "pointer" }}>
          Search
        </button>
      </form>

      {/* Map area */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Search this area button */}
        {showSearchArea && (
          <button
            onClick={handleSearchThisArea}
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 15,
              background: "white",
              color: "var(--primary)",
              border: "1px solid var(--border)",
              borderRadius: "999px",
              padding: "0.6rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              whiteSpace: "nowrap",
            }}
          >
            Search this area
          </button>
        )}

        {/* My Location button */}
        <button
          onClick={handleMyLocation}
          title="My Location"
          style={{
            position: "absolute",
            bottom: 72,
            right: 16,
            zIndex: 15,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          &#9737;
        </button>

        {/* Bottom panel */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "white",
            borderTop: "1px solid var(--border)",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 15,
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            {loading ? (
              "Loading..."
            ) : (
              <>
                <strong style={{ color: "var(--primary)" }}>{spaces.length}</strong>
                {" "}parking space{spaces.length !== 1 ? "s" : ""} found
              </>
            )}
          </span>
          <Link href="/search" style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "white", borderRadius: "var(--radius)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>
            List View
          </Link>
        </div>
      </div>
    </div>
  );
}
