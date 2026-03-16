"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet in bundled environments
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface HolePosition {
  number: number;
  latitude: number | null;
  longitude: number | null;
}

interface HoleMapProps {
  center: [number, number];
  holes: HolePosition[];
  activeHole: number;
  onHolePositioned: (holeIndex: number, lat: number, lng: number) => void;
  onSave?: () => void;
  saving?: boolean;
}

// Color per hole for markers
const HOLE_COLORS = [
  "#34D399", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA",
  "#FB923C", "#2DD4BF", "#E879F9", "#F87171", "#4ADE80",
  "#38BDF8", "#FB7185", "#FACC15", "#818CF8", "#F97316",
  "#22D3EE", "#C084FC", "#EF4444",
];

function getHoleIcon(number: number, isActive: boolean) {
  const color = HOLE_COLORS[(number - 1) % HOLE_COLORS.length];
  const size = isActive ? 32 : 24;
  const fontSize = isActive ? 13 : 10;
  const border = isActive ? "3px solid white" : "2px solid rgba(255,255,255,0.6)";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;font-weight:700;color:#000;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      cursor:pointer;
      transition: all 0.2s;
    ">${number}</div>`,
  });
}

// Haversine distance in meters
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function HoleMap({ center, holes, activeHole, onHolePositioned, onSave, saving }: HoleMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const linesRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 19,
      zoomControl: true,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Esri",
      maxZoom: 21,
    }).addTo(map);

    // Labels overlay
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 21,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle map click
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onHolePositioned(activeHole, e.latlng.lat, e.latlng.lng);
    };

    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [activeHole, onHolePositioned]);

  // Update markers + lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    // Remove old lines - recreate layer group if needed
    if (linesRef.current) {
      try {
        linesRef.current.clearLayers();
        if (!map.hasLayer(linesRef.current)) {
          linesRef.current.addTo(map);
        }
      } catch {
        linesRef.current = L.layerGroup().addTo(map);
      }
    } else {
      linesRef.current = L.layerGroup().addTo(map);
    }

    const positioned = holes.filter((h) => h.latitude != null && h.longitude != null);

    // Add markers
    positioned.forEach((hole) => {
      const marker = L.marker([hole.latitude!, hole.longitude!], {
        icon: getHoleIcon(hole.number, hole.number === activeHole + 1),
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onHolePositioned(hole.number - 1, pos.lat, pos.lng);
      });

      marker.bindTooltip(`Trou ${hole.number}`, { direction: "top", offset: [0, -14] });
      markersRef.current.set(hole.number, marker);
    });

    // Draw lines between ALL positioned holes (in order) + distance labels
    if (positioned.length >= 2) {
      for (let i = 0; i < positioned.length - 1; i++) {
        const a = positioned[i];
        const b = positioned[i + 1];
        const color = HOLE_COLORS[(a.number - 1) % HOLE_COLORS.length];
        const posA: [number, number] = [a.latitude!, a.longitude!];
        const posB: [number, number] = [b.latitude!, b.longitude!];

        // Polyline
        const line = L.polyline([posA, posB], {
          color,
          weight: 3,
          opacity: 0.8,
          dashArray: "8, 6",
        });
        linesRef.current!.addLayer(line);

        // Distance label at midpoint
        const dist = haversine(a.latitude!, a.longitude!, b.latitude!, b.longitude!);
        const midLat = (a.latitude! + b.latitude!) / 2;
        const midLng = (a.longitude! + b.longitude!) / 2;

        const label = L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: "",
            iconSize: [64, 24],
            iconAnchor: [32, 12],
            html: `<div style="
              background: rgba(0,0,0,0.8);
              backdrop-filter: blur(4px);
              border: 1px solid ${color}60;
              border-radius: 6px;
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 700;
              color: ${color};
              text-align: center;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            ">${dist}m</div>`,
          }),
          interactive: false,
        });
        linesRef.current!.addLayer(label);
      }
    }
  }, [holes, activeHole, onHolePositioned]);

  // Recenter when center changes
  useEffect(() => {
    if (mapRef.current && center[0] !== 0 && center[1] !== 0) {
      mapRef.current.setView(center, 19);
    }
  }, [center]);

  const recenter = () => {
    if (mapRef.current && center[0] !== 0) {
      mapRef.current.flyTo(center, 19, { duration: 0.8 });
    }
  };

  const fitAllHoles = () => {
    if (!mapRef.current) return;
    const positioned = holes.filter((h) => h.latitude != null && h.longitude != null);
    if (positioned.length === 0) { recenter(); return; }
    const bounds = L.latLngBounds(
      positioned.map((h) => [h.latitude!, h.longitude!] as [number, number])
    );
    // Include course center
    bounds.extend(center);
    mapRef.current.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
  };

  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 350);
  };

  // ESC to close fullscreen
  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleExpand();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div
      className={`${
        expanded
          ? "fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          : "relative"
      }`}
    >
      <div className={`relative ${expanded ? "w-full h-full max-w-[95vw] max-h-[90vh]" : "w-full"}`}>
        <div
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden border border-white/[0.06]"
          style={{ height: expanded ? "100%" : 350 }}
        />
        {/* Map controls */}
        <div className="absolute top-2.5 right-2.5 z-[10000] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={toggleExpand}
            title={expanded ? "Reduire" : "Agrandir la carte"}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark/80 backdrop-blur-sm border border-white/10 text-white hover:bg-dark hover:border-accent/30 transition-colors shadow-lg"
          >
            {expanded ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={recenter}
            title="Recentrer sur le golf"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark/80 backdrop-blur-sm border border-white/10 text-white hover:bg-dark hover:border-accent/30 transition-colors shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={fitAllHoles}
            title="Voir tous les trous"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark/80 backdrop-blur-sm border border-white/10 text-white hover:bg-dark hover:border-accent/30 transition-colors shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" />
              <path d="M21 9V5A2 2 0 0 0 19 3H5A2 2 0 0 0 3 5V9" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </button>
        </div>
        {/* Save button */}
        {onSave && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-dark text-[13px] font-bold shadow-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3), 0 4px 12px rgba(0,0,0,0.4)" }}
            >
              {saving ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            {expanded && (
              <span className="px-3 py-1.5 rounded-lg bg-dark/80 backdrop-blur-sm border border-white/10 text-[11px] text-gray-400 font-medium">
                ESC pour reduire
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
