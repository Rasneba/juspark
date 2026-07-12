"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function getLat(s: any): number { return s.latitude || s.lat || 9.0054; }
function getLng(s: any): number { return s.longitude || s.lng || 38.7636; }

function createPriceIcon(price: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#1B1B1B;color:#fff;padding:3px 7px;border-radius:5px;font-size:11px;font-weight:700;font-family:system-ui,sans-serif;white-space:nowrap;border:2px solid #4A90D9;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer">${price}</div>`,
    iconSize: [0, 0],
    iconAnchor: [22, 11],
    popupAnchor: [0, -14],
  });
}

function createMyLocationIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:#4A90D9;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #4A90D9, 0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const spacesRef = useRef<any[]>([]);
  const onSelectRef = useRef(onSelectSpace);
  const onCenterChangeRef = useRef(onCenterChange);

  onSelectRef.current = onSelectSpace;
  onCenterChangeRef.current = onCenterChange;

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("moveend", () => {
      const c = map.getCenter();
      onCenterChangeRef.current(c.lat, c.lng);
    });

    mapRef.current = map;
  }, [center]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(center, 15, { duration: 0.8 });
  }, [center[0], center[1]]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    spacesRef.current = spaces;

    spaces.forEach((space: any) => {
      const lat = getLat(space);
      const lng = getLng(space);
      const price = space.pricing?.[0];
      const priceText = price ? `ETB ${price.price}` : space.name;

      const icon = createPriceIcon(priceText);
      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!);

      marker.on("click", (e: L.LeafletEvent) => {
        L.DomEvent.stopPropagation(e as any);
        onSelectRef.current(space);
      });

      markersRef.current.push(marker);
    });
  }, [spaces]);

  useEffect(() => {
    (window as any).__leafletMapView = {
      showMyLocation: (lat: number, lng: number) => {
        if (!mapRef.current) return;
        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.remove();
        }
        const icon = createMyLocationIcon();
        myLocationMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
        mapRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
      },
    };
    return () => { delete (window as any).__leafletMapView; };
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}
