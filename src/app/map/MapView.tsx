"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function getLat(s: any): number { return s.latitude || s.lat || 9.0054; }
function getLng(s: any): number { return s.longitude || s.lng || 38.7636; }

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="background:#1B1B1B;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;font-family:system-ui,sans-serif;white-space:nowrap;border:2px solid #4A90D9;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function createMarkerIcon(priceText: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#1B1B1B;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;font-family:system-ui,sans-serif;white-space:nowrap;border:2px solid #4A90D9;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${priceText}</div>`,
    iconSize: [0, 0],
    iconAnchor: [20, 10],
  });
}

interface MapViewProps {
  center: [number, number];
  spaces: any[];
  onCenterChange: (lat: number, lng: number) => void;
  onSelectSpace: (space: any) => void;
}

export default function MapView({ center, spaces, onCenterChange, onSelectSpace }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("movestart", () => { isDragging.current = true; });
    map.on("moveend", () => {
      isDragging.current = false;
      const c = map.getCenter();
      onCenterChange(c.lat, c.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, mapRef.current.getZoom(), { animate: true });
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spaces.forEach((space: any) => {
      const lat = getLat(space);
      const lng = getLng(space);
      const price = space.pricing?.[0];
      const priceText = price ? `ETB ${price.price}` : "";

      const icon = createMarkerIcon(priceText);
      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!);

      marker.on("click", () => {
        onSelectSpace(space);
      });

      markersRef.current.push(marker);
    });
  }, [spaces, onSelectSpace]);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}
