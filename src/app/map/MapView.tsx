"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function getLat(s: any): number { return s.latitude || 9.0054; }
function getLng(s: any): number { return s.longitude || 38.7636; }

function createPriceIcon(price: string, selected: boolean, spaceName: string, spaceType: string) {
  return L.divIcon({
    className: "",
    html: `<div class="parkme-marker" role="button" tabindex="0" aria-label="Parking: ${spaceName}, ${spaceType}, ${price}" aria-pressed="${selected}" style="background:${selected ? "#128a42" : "#1B1B1B"};color:#fff;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;font-family:system-ui,sans-serif;white-space:nowrap;border:2px solid ${selected ? "#fff" : "#128a42"};box-shadow:0 2px 10px rgba(0,0,0,0.35);cursor:pointer;outline:none;${selected ? "transform:scale(1.15);z-index:9999;" : ""}">${price}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createMyLocationIcon() {
  return L.divIcon({
    className: "",
    html: `<div role="img" aria-label="Your current location" style="position:relative;width:30px;height:30px"><div style="position:absolute;inset:0;background:rgba(18,138,66,0.15);border-radius:50%;animation:pulse 2s infinite"></div><div style="position:absolute;top:5px;left:5px;width:20px;height:20px;background:#128a42;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function createPoiIcon(emoji: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div role="img" aria-label="${label}" style="background:white;border-radius:8px;padding:3px 6px;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;gap:3px;font-size:11px;font-family:system-ui,sans-serif;white-space:nowrap;border:1px solid #e5e7eb;cursor:pointer"><span style="font-size:14px" aria-hidden="true">${emoji}</span><span style="font-weight:600;color:#374151;max-width:80px;overflow:hidden;text-overflow:ellipsis">${label}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 15],
  });
}

function createSearchResultIcon() {
  return L.divIcon({
    className: "",
    html: `<div role="img" aria-label="Search result location" style="width:16px;height:16px;background:#d92323;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface PoiItem {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: string;
}

interface MapViewProps {
  center: [number, number];
  spaces: any[];
  pois: PoiItem[];
  selectedId: string | null;
  satellite: boolean;
  showPois: boolean;
  searchResult: { lat: number; lng: number; name: string } | null;
  onCenterChange: (lat: number, lng: number) => void;
  onSelectSpace: (space: any) => void;
}

export default function MapView({ center, spaces, pois, selectedId, satellite, showPois, searchResult, onCenterChange, onSelectSpace }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const poiMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const searchResultMarkerRef = useRef<L.Marker | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const onSelectRef = useRef(onSelectSpace);
  const onCenterChangeRef = useRef(onCenterChange);
  const focusedIndexRef = useRef<number>(-1);

  onSelectRef.current = onSelectSpace;
  onCenterChangeRef.current = onCenterChange;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      keyboard: true,
      keyboardPanDelta: 80,
    } as any);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    });
    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
    });

    street.addTo(map);
    streetLayerRef.current = street;
    satelliteLayerRef.current = sat;

    map.on("moveend", () => {
      const c = map.getCenter();
      onCenterChangeRef.current(c.lat, c.lng);
    });

    mapRef.current = map;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0}100%{transform:scale(1);opacity:1}}
      .parkme-marker{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation;}
      .parkme-marker:focus{outline:3px solid #128a42;outline-offset:2px;border-radius:6px;}
      .parkme-marker:focus-visible{outline:3px solid #128a42;outline-offset:2px;border-radius:6px;}
      .parkme-marker:hover{transform:scale(1.1);transition:transform 0.15s ease;}
      .parkme-marker[aria-pressed="true"]{transform:scale(1.15);z-index:9999;}
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (satellite) {
      streetLayerRef.current?.remove();
      satelliteLayerRef.current?.addTo(mapRef.current);
    } else {
      satelliteLayerRef.current?.remove();
      streetLayerRef.current?.addTo(mapRef.current);
    }
  }, [satellite]);

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
      const spaceType = space.space_type || space.spaceType || "parking";

      const existing = markersRef.current.get(space.id);
      if (existing) {
        existing.setIcon(createPriceIcon(priceText, isSelected, space.name, spaceType));
        return;
      }

      const icon = createPriceIcon(priceText, isSelected, space.name, spaceType);
      const marker = L.marker([lat, lng], {
        icon,
        interactive: true,
        bubblingMouseEvents: false,
        keyboard: true,
      }).addTo(map);

      const handleSelect = (e?: Event) => {
        if (e) { e.stopPropagation?.(); e.preventDefault?.(); }
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

        el.addEventListener("touchend", (e: TouchEvent) => { e.stopPropagation(); handleSelect(e); }, { passive: false });
        el.addEventListener("click", (e: MouseEvent) => { e.stopPropagation(); handleSelect(e); });

        el.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            handleSelect(e);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onSelectRef.current(null as any);
          }
        });
      }

      markersRef.current.set(space.id, marker);
    });
  }, [spaces, selectedId]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existingIds = new Set(pois.map((p) => p.id));

    poiMarkersRef.current.forEach((marker, id) => {
      if (!existingIds.has(id)) {
        marker.remove();
        poiMarkersRef.current.delete(id);
      }
    });

    if (!showPois) {
      poiMarkersRef.current.forEach((marker) => marker.remove());
      poiMarkersRef.current.clear();
      return;
    }

    const poiEmoji: Record<string, string> = {
      airport: "✈️", hotel: "🏨", motel: "🏨", hostel: "🏨",
      mall: "🛍", shop: "🛍", supermarket: "🛒",
      street: "🛣", road: "🛣",
      restaurant: "🍽", cafe: "☕", bar: "🍺",
      hospital: "🏥", pharmacy: "💊",
      bank: "🏦", atm: "🏧",
      parking: "🅿", fuel: "⛽",
      school: "🏫", university: "🎓",
      church: "⛪", mosque: "🕌",
    };

    pois.forEach((poi) => {
      if (poiMarkersRef.current.has(poi.id)) return;
      const emoji = poiEmoji[poi.type] || "📍";
      const icon = createPoiIcon(emoji, poi.name.length > 16 ? poi.name.slice(0, 16) + "…" : poi.name);
      const marker = L.marker([poi.lat, poi.lng], {
        icon,
        interactive: true,
        bubblingMouseEvents: false,
        zIndexOffset: -1000,
        keyboard: false,
      }).addTo(map);
      marker.bindTooltip(poi.name, { permanent: false, direction: "top", offset: [0, -15] });
      poiMarkersRef.current.set(poi.id, marker);
    });
  }, [pois, showPois]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (searchResult) {
      if (searchResultMarkerRef.current) searchResultMarkerRef.current.remove();
      const icon = createSearchResultIcon();
      searchResultMarkerRef.current = L.marker([searchResult.lat, searchResult.lng], { icon, zIndexOffset: 5000 })
        .addTo(mapRef.current)
        .bindTooltip(searchResult.name, { permanent: true, direction: "top", offset: [0, -12], className: "search-tooltip" });
    } else if (searchResultMarkerRef.current) {
      searchResultMarkerRef.current.remove();
      searchResultMarkerRef.current = null;
    }
  }, [searchResult]);

  useEffect(() => {
    (window as any).__leafletMapView = {
      showMyLocation: (lat: number, lng: number) => {
        if (!mapRef.current) return;
        if (myLocationMarkerRef.current) myLocationMarkerRef.current.remove();
        const icon = createMyLocationIcon();
        myLocationMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 10000 }).addTo(mapRef.current);
        mapRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
      },
      removeMyLocation: () => {
        if (myLocationMarkerRef.current) { myLocationMarkerRef.current.remove(); myLocationMarkerRef.current = null; }
      },
    };
    return () => { delete (window as any).__leafletMapView; };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
      role="application"
      aria-label="Interactive parking map. Use arrow keys to pan, +/- to zoom, Enter to select a parking spot marker."
      aria-roledescription="interactive map"
    />
  );
}
