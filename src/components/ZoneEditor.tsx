"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ZonePoint { lat: number; lng: number; }
interface Zone { type: string; points: ZonePoint[]; id?: string; }

const ZONE_TYPES = [
  { key: "ob", label: "OB", color: "#FF5050" },
  { key: "water", label: "Eau", color: "#4488FF" },
  { key: "bunker", label: "Bunker", color: "#DCC864" },
  { key: "trees", label: "Arbres", color: "#228B22" },
];

interface Props {
  center: [number, number];
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
}

export default function ZoneEditor({ center, zones, onZonesChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [activeType, setActiveType] = useState("ob");
  const [draft, setDraft] = useState<ZonePoint[]>([]);
  const draftLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = L.map(containerRef.current, { center, zoom: 16, zoomControl: false });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 20, attribution: "Esri" }
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    draftLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      setDraft((prev) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [center[0], center[1]]);

  // Draw saved zones
  useEffect(() => {
    if (!zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();
    zones.forEach((z, i) => {
      if (z.points.length < 3) return;
      const color = ZONE_TYPES.find((t) => t.key === z.type)?.color || "#888";
      const latlngs = z.points.map((p) => [p.lat, p.lng] as [number, number]);
      const poly = L.polygon(latlngs, {
        color, weight: 2, opacity: 0.7, fillColor: color, fillOpacity: 0.15,
      });
      poly.addTo(zonesLayerRef.current!);

      // Label
      const bounds = poly.getBounds();
      const center = bounds.getCenter();
      const label = ZONE_TYPES.find((t) => t.key === z.type)?.label || z.type;
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:rgba(15,20,28,0.75);border:1px solid ${color}40;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:700;color:${color};white-space:nowrap">${label}</div>`,
        iconAnchor: [20, 8],
      });
      L.marker(center, { icon, interactive: false }).addTo(zonesLayerRef.current!);
    });
  }, [zones]);

  // Draw draft
  useEffect(() => {
    if (!draftLayerRef.current) return;
    draftLayerRef.current.clearLayers();
    const color = ZONE_TYPES.find((t) => t.key === activeType)?.color || "#FF5050";

    // Points
    draft.forEach((p) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 5, color, fillColor: color, fillOpacity: 0.8, weight: 2,
      }).addTo(draftLayerRef.current!);
    });

    // Line + close preview
    if (draft.length >= 2) {
      const latlngs = draft.map((p) => [p.lat, p.lng] as [number, number]);
      latlngs.push(latlngs[0]); // close
      L.polyline(latlngs, { color, weight: 2, dashArray: "6,4", opacity: 0.8 }).addTo(draftLayerRef.current!);
    }

    // Fill preview
    if (draft.length >= 3) {
      const latlngs = draft.map((p) => [p.lat, p.lng] as [number, number]);
      L.polygon(latlngs, { color, weight: 0, fillColor: color, fillOpacity: 0.12 }).addTo(draftLayerRef.current!);
    }
  }, [draft, activeType]);

  const closeDraft = () => {
    if (draft.length < 3) return;
    onZonesChange([...zones, { type: activeType, points: draft }]);
    setDraft([]);
  };

  const undoPoint = () => setDraft((prev) => prev.slice(0, -1));

  const removeZone = (index: number) => {
    onZonesChange(zones.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex items-center gap-2">
        {ZONE_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveType(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              activeType === t.key
                ? "border-current bg-current/10"
                : "border-white/[0.06] text-gray-500 hover:text-gray-300"
            }`}
            style={activeType === t.key ? { color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}15` } : {}}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Map + controls */}
      <div className="relative rounded-xl overflow-hidden border border-white/[0.06]" style={{ height: 320 }}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Floating controls */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-[1000]">
          {draft.length > 0 && (
            <button
              type="button"
              onClick={undoPoint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark/80 border border-white/10 text-[11px] font-medium text-gray-300 hover:bg-dark transition-colors backdrop-blur-sm"
            >
              Annuler ({draft.length})
            </button>
          )}
          {draft.length >= 3 && (
            <button
              type="button"
              onClick={closeDraft}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-dark transition-colors"
              style={{ backgroundColor: ZONE_TYPES.find((t) => t.key === activeType)?.color }}
            >
              Fermer la zone
            </button>
          )}
          {draft.length === 0 && (
            <div className="px-2.5 py-1.5 rounded-lg bg-dark/70 border border-white/10 text-[11px] text-gray-400 backdrop-blur-sm">
              Cliquez pour tracer une zone
            </div>
          )}
        </div>
      </div>

      {/* Saved zones list */}
      {zones.length > 0 && (
        <div className="space-y-1">
          {zones.map((z, i) => {
            const cfg = ZONE_TYPES.find((t) => t.key === z.type);
            return (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg?.color || "#888" }} />
                  <span className="text-[12px] font-medium" style={{ color: cfg?.color || "#888" }}>{cfg?.label || z.type}</span>
                  <span className="text-[10px] text-gray-600">{z.points.length} pts</span>
                </div>
                <button type="button" onClick={() => removeZone(i)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
