"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function getLat(s: any): number { return s.latitude || 9.0054; }
function getLng(s: any): number { return s.longitude || 38.7636; }

function createPriceIcon(price: string, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="parkme-marker" data-selected="${selected}" style="background:${selected ? "#4A90D9" : "#1B1B1B"};color:#fff;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;font-family:system-ui,sans-serif;white-space:nowrap;border:2px solid ${selected ? "#fff" : "#4A90D9"};box-shadow:0 2px 10px rgba(0,0,0,0.35);cursor:pointer;${selected ? "transform:scale(1.15);z-index:9999;" : ""}">${price}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createMyLocationIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px"><div style="position:absolute;inset:0;background:rgba(74,144,217,0.2);border-radius:50%;animation:pulse 2s infinite"></div><div style="position:absolute;top:4px;left:4px;width:16px;height:16px;background:#4A90D9;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface MapViewProps {
  center: [number, number];
  spaces: any[];
  selectedId: string | null;
  onCenterChange: (lat: number, lng: number) => void;
  onSelectSpace: (space: any) => void;
}

export default function MapView({ center, spaces, selectedId, onCenterChange, onSelectSpace }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelectSpace);
  const onCenterChangeRef = useRef(onCenterChange);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onSelectRef.current = onSelectSpace;
  onCenterChangeRef.current = onCenterChange;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    } as any);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("moveend", () => {
      const c = map.getCenter();
      onCenterChangeRef.current(c.lat, c.lng);
    });

    mapRef.current = map;

    const style = document.createElement("style");
    style.textContent = `@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0}100%{transform:scale(1);opacity:1}}.parkme-marker{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation;}`;
    document.head.appendChild(style);

    return () => {
      style.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const dist = Math.abs(mapRef.current.getCenter().lat - center[0]) + Math.abs(mapRef.current.getCenter().lng - center[1]);
    if (dist > 0.001) {
      mapRef.current.flyTo(center, mapRef.current.getZoom(), { duration: 0.8 });
    }
  }, [center[0], center[1]]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existingIds = new Set(spaces.map((s: any) => s.id));

    markersRef.current.forEach((marker, id) => {
      if (!existingIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    spaces.forEach((space: any) => {
      const lat = getLat(space);
      const lng = getLng(space);
      const price = space.pricing?.[0];
      const priceText = price ? `ETB ${price.price}` : space.name;
      const isSelected = space.id === selectedId;

      const existing = markersRef.current.get(space.id);
      if (existing) {
        existing.setIcon(createPriceIcon(priceText, isSelected));
        return;
      }

      const icon = createPriceIcon(priceText, isSelected);
      const marker = L.marker([lat, lng], { icon, interactive: true, bubblingMouseEvents: false }).addTo(map);

      const handleSelect = (e?: Event) => {
        if (e) {
          e.stopPropagation?.();
          e.preventDefault?.();
        }
        onSelectRef.current(space);
      };

      marker.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent);
        handleSelect();
      });

      const el = marker.getElement();
      if (el) {
        el.style.pointerEvents = "auto";
        el.style.cursor = "pointer";
        el.style.touchAction = "manipulation";

        el.addEventListener("touchend", (e: TouchEvent) => {
          e.stopPropagation();
          handleSelect(e);
        }, { passive: false });

        el.addEventListener("click", (e: MouseEvent) => {
          e.stopPropagation();
          handleSelect(e);
        });
      }

      markersRef.current.set(space.id, marker);
    });
  }, [spaces, selectedId]);

  useEffect(() => {
    (window as any).__leafletMapView = {
      showMyLocation: (lat: number, lng: number) => {
        if (!mapRef.current) return;
        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.remove();
        }
        const icon = createMyLocationIcon();
        myLocationMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 10000 }).addTo(mapRef.current);
        mapRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
      },
    };
    return () => { delete (window as any).__leafletMapView; };
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%", zIndex: 0 }} />
  );
}
