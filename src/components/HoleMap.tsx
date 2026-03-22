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

interface ZonePoint { lat: number; lng: number; }
interface ZoneData { type: string; points: ZonePoint[]; id?: string; }

const ZONE_TYPES = [
  { key: "ob", label: "OB", color: "#FF5050" },
  { key: "water", label: "Eau", color: "#4488FF" },
  { key: "bunker", label: "Bunker", color: "#DCC864" },
  { key: "trees", label: "Arbres", color: "#228B22" },
];

interface HoleMapProps {
  center: [number, number];
  holes: HolePosition[];
  activeHole: number;
  onHolePositioned: (holeIndex: number, lat: number, lng: number) => void;
  onSave?: () => void;
  saving?: boolean;
  zones?: ZoneData[];
  onZonesChange?: (zones: ZoneData[]) => void;
  courseId?: string;
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

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function HoleMap({ center, holes, activeHole, onHolePositioned, onSave, saving, zones = [], onZonesChange, courseId }: HoleMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const linesRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const draftLayerRef = useRef<L.LayerGroup | null>(null);
  const [mode, setMode] = useState<"holes" | "zones">("holes");
  const [zoneTool, setZoneTool] = useState<"draw" | "pan">("pan");
  const [activeZoneType, setActiveZoneType] = useState("ob");
  const [zoneDraft, setZoneDraft] = useState<ZonePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingRef = useRef(false);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const [golfBoundary, setGolfBoundary] = useState<ZonePoint[] | null>(null);

  // Initialize map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup previous map if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Small delay to ensure container is in DOM and has dimensions
    const timer = setTimeout(() => {
      if (!container.offsetWidth) return;

      const map = L.map(container, {
        center,
        zoom: 19,
        zoomControl: true,
      });

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Esri",
        maxZoom: 21,
      }).addTo(map);

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 21,
      }).addTo(map);

      boundaryLayerRef.current = L.layerGroup().addTo(map);
      zonesLayerRef.current = L.layerGroup().addTo(map);
      draftLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle map interactions
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (mode === "holes") {
        onHolePositioned(activeHole, e.latlng.lat, e.latlng.lng);
      }
    };

    // Freehand drawing for zones (only in draw tool)
    let lastTime = 0;
    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (mode !== "zones" || zoneTool !== "draw") return;
      drawingRef.current = true;
      setIsDrawing(true);
      setZoneDraft([{ lat: e.latlng.lat, lng: e.latlng.lng }]);
      map.dragging.disable();
    };
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return;
      const now = Date.now();
      if (now - lastTime < 40) return;
      lastTime = now;
      setZoneDraft((prev) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    };
    const handleMouseUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      setIsDrawing(false);
      map.dragging.enable();
    };

    map.on("click", handleClick);
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.off("click", handleClick);
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.dragging.enable();
    };
  }, [activeHole, onHolePositioned, mode, zoneTool]);

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

  // Draw golf boundary
  useEffect(() => {
    if (!boundaryLayerRef.current) return;
    boundaryLayerRef.current.clearLayers();
    if (!golfBoundary || golfBoundary.length < 3) return;
    const latlngs = golfBoundary.map((p) => [p.lat, p.lng] as [number, number]);
    L.polygon(latlngs, {
      color: "#82FFB4",
      weight: 2,
      opacity: 0.5,
      fillColor: "#82FFB4",
      fillOpacity: 0.03,
      dashArray: "8,6",
    }).addTo(boundaryLayerRef.current);
  }, [golfBoundary]);

  // Draw saved zones
  useEffect(() => {
    if (!zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();
    zones.forEach((z) => {
      if (z.points.length < 3) return;
      const color = ZONE_TYPES.find((t) => t.key === z.type)?.color || "#888";
      const latlngs = z.points.map((p) => [p.lat, p.lng] as [number, number]);
      L.polygon(latlngs, { color, weight: 2, opacity: 0.7, fillColor: color, fillOpacity: 0.15 }).addTo(zonesLayerRef.current!);
      const bounds = L.latLngBounds(latlngs);
      const c = bounds.getCenter();
      const label = ZONE_TYPES.find((t) => t.key === z.type)?.label || z.type;
      L.marker(c, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:rgba(15,20,28,0.75);border:1px solid ${color}40;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:700;color:${color};white-space:nowrap">${label}</div>`,
          iconAnchor: [20, 8],
        }),
        interactive: false,
      }).addTo(zonesLayerRef.current!);
    });
  }, [zones]);

  // Draw zone draft
  useEffect(() => {
    if (!draftLayerRef.current) return;
    draftLayerRef.current.clearLayers();
    if (mode !== "zones" || zoneDraft.length === 0) return;
    const color = ZONE_TYPES.find((t) => t.key === activeZoneType)?.color || "#FF5050";

    if (isDrawing) {
      // While drawing: show line only
      if (zoneDraft.length >= 2) {
        const latlngs = zoneDraft.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(latlngs, { color, weight: 3, opacity: 0.9 }).addTo(draftLayerRef.current!);
      }
    } else {
      // After drawing: show closed polygon
      if (zoneDraft.length >= 3) {
        const latlngs = zoneDraft.map((p) => [p.lat, p.lng] as [number, number]);
        L.polygon(latlngs, { color, weight: 2.5, opacity: 0.8, fillColor: color, fillOpacity: 0.15 }).addTo(draftLayerRef.current!);
      } else if (zoneDraft.length >= 2) {
        const latlngs = zoneDraft.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(latlngs, { color, weight: 2, dashArray: "6,4", opacity: 0.8 }).addTo(draftLayerRef.current!);
      }
    }
  }, [zoneDraft, mode, activeZoneType, isDrawing]);

  const closeZoneDraft = () => {
    if (zoneDraft.length < 3 || !onZonesChange) return;
    onZonesChange([...zones, { type: activeZoneType, points: zoneDraft }]);
    setZoneDraft([]);
  };

  const removeZone = (index: number) => {
    if (!onZonesChange) return;
    onZonesChange(zones.filter((_, i) => i !== index));
  };

  const [detecting, setDetecting] = useState(false);

  const handleAutoDetect = async () => {
    if (!onZonesChange) return;
    setDetecting(true);
    try {
      const url = courseId
        ? `${API}/courses/${courseId}/detect-zones`
        : `${API}/courses/detect-zones-by-coords`;
      const body = courseId
        ? { radius: 500 }
        : { latitude: center[0], longitude: center[1], radius: 500 };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Detection failed");
      const data = await res.json();
      if (data.boundary) {
        setGolfBoundary(data.boundary);
      }
      if (data.zones && data.zones.length > 0) {
        onZonesChange([...zones, ...data.zones.map((z: any) => ({ type: z.type, points: z.points }))]);
      }
    } catch (e) {
      console.error("Auto-detect error:", e);
    } finally {
      setDetecting(false);
    }
  };

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
          style={{ height: expanded ? "100%" : 350, cursor: mode === "zones" && zoneTool === "draw" ? "crosshair" : undefined }}
        />
        {/* Mode toggle + zone controls */}
        {onZonesChange && (
          <div className="absolute top-2.5 left-2.5 z-[10000] flex flex-col gap-2">
            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-dark/80 backdrop-blur-sm border border-white/10">
              <button type="button" onClick={() => { setMode("holes"); setZoneDraft([]); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${mode === "holes" ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-white"}`}>
                Trous
              </button>
              <button type="button" onClick={() => setMode("zones")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${mode === "zones" ? "bg-amber-500/20 text-amber-400" : "text-gray-400 hover:text-white"}`}>
                Zones
              </button>
            </div>

            {/* Zone controls */}
            {mode === "zones" && (
              <div className="flex flex-col gap-1">
                {/* Draw / Pan toggle */}
                <div className="flex gap-1 p-1 rounded-xl bg-dark/80 backdrop-blur-sm border border-white/10">
                  <button type="button" onClick={() => setZoneTool("pan")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${zoneTool === "pan" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v6M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L2.3 15.7a2 2 0 0 1 2.9-2.8L6 14"/></svg>
                    Deplacer
                  </button>
                  <button type="button" onClick={() => setZoneTool("draw")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${zoneTool === "draw" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-white"}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                    Dessiner
                  </button>
                </div>

                {/* Zone type selector */}
                {zoneTool === "draw" && ZONE_TYPES.map((t) => (
                  <button key={t.key} type="button" onClick={() => { setActiveZoneType(t.key); setZoneDraft([]); }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all backdrop-blur-sm"
                    style={{
                      backgroundColor: activeZoneType === t.key ? `${t.color}20` : "rgba(13,17,23,0.7)",
                      border: `1px solid ${activeZoneType === t.key ? `${t.color}60` : "rgba(255,255,255,0.08)"}`,
                      color: activeZoneType === t.key ? t.color : "rgba(255,255,255,0.5)",
                    }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.label}
                  </button>
                ))}

                {/* Draft controls */}
                {zoneDraft.length > 0 && !isDrawing && (
                  <div className="flex gap-1 mt-1">
                    <button type="button" onClick={() => setZoneDraft([])}
                      className="px-2.5 py-1.5 rounded-lg bg-dark/80 border border-white/10 text-[10px] font-medium text-gray-300 hover:bg-dark backdrop-blur-sm">
                      Refaire
                    </button>
                    {zoneDraft.length >= 3 && (
                      <button type="button" onClick={closeZoneDraft}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-dark"
                        style={{ backgroundColor: ZONE_TYPES.find((t) => t.key === activeZoneType)?.color }}>
                        Valider
                      </button>
                    )}
                  </div>
                )}
                {isDrawing && (
                  <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-dark/70 border border-white/10 text-[10px] text-gray-300 backdrop-blur-sm animate-pulse">
                    Tracez la zone...
                  </div>
                )}

                {/* AI auto-detect button */}
                {(courseId || (center[0] !== 0 && center[1] !== 0)) && (
                  <button
                    type="button"
                    onClick={handleAutoDetect}
                    disabled={detecting}
                    className="mt-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-400 hover:bg-purple-500/25 transition-all backdrop-blur-sm disabled:opacity-50"
                  >
                    {detecting ? (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 6H8" /><path d="M14 12h-2s2-4 2-6a4 4 0 0 0-4-4" />
                        <circle cx="12" cy="17" r="3" /><path d="M12 20v2" />
                      </svg>
                    )}
                    {detecting ? "Detection..." : "Detection AI"}
                  </button>
                )}

                {/* Saved zones list */}
                {zones.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {zones.map((z, i) => {
                      const cfg = ZONE_TYPES.find((t) => t.key === z.type);
                      return (
                        <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-dark/70 border border-white/[0.06] backdrop-blur-sm">
                          <span className="text-[10px] font-semibold" style={{ color: cfg?.color }}>{cfg?.label} · {z.points.length}pts</span>
                          <button type="button" onClick={() => removeZone(i)} className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-red-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
