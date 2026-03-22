"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Declaration {
  id: string;
  type: string;
  points: { lat: number; lng: number }[];
  message: string | null;
  user: { id: string; name: string; email: string };
  course: { id: string; name: string; city: string };
}

interface CourseZone {
  id: string;
  type: string;
  points: { lat: number; lng: number }[];
}

interface Props {
  declaration: Declaration;
  courseZones: CourseZone[];
  typeConfig: Record<string, { label: string; mapColor: string }>;
  zoneColors: Record<string, string>;
}

export default function DeclarationMap({ declaration, courseZones, typeConfig, zoneColors }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Calculate center from declaration points
    const lats = declaration.points.map((p) => p.lat);
    const lngs = declaration.points.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 18,
      zoomControl: false,
    });

    // Satellite tile layer
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 20, attribution: "Esri" }
    ).addTo(map);

    // Zoom control bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Draw existing course zones (subtle)
    courseZones.forEach((zone) => {
      if (zone.points.length < 3) return;
      const color = zoneColors[zone.type] || "#888";
      const latlngs = zone.points.map((p) => [p.lat, p.lng] as [number, number]);
      L.polygon(latlngs, {
        color: color,
        weight: 1.5,
        opacity: 0.4,
        fillColor: color,
        fillOpacity: 0.08,
        dashArray: "6,3",
      }).addTo(map);
    });

    // Draw the declaration polygon (highlighted)
    const declColor = typeConfig[declaration.type]?.mapColor || "#FF4444";
    const declLatLngs = declaration.points.map((p) => [p.lat, p.lng] as [number, number]);

    // Glowing border effect
    L.polygon(declLatLngs, {
      color: declColor,
      weight: 4,
      opacity: 0.3,
      fillColor: declColor,
      fillOpacity: 0,
      dashArray: undefined,
    }).addTo(map);

    // Main polygon
    const declPolygon = L.polygon(declLatLngs, {
      color: declColor,
      weight: 2.5,
      opacity: 0.9,
      fillColor: declColor,
      fillOpacity: 0.15,
    }).addTo(map);

    // Label at center
    const label = typeConfig[declaration.type]?.label || declaration.type;
    const icon = L.divIcon({
      className: "",
      html: `<div style="
        background: rgba(15,20,28,0.8);
        border: 1px solid ${declColor}40;
        border-radius: 6px;
        padding: 3px 8px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="font-size:10px;font-weight:700;color:${declColor};letter-spacing:0.3px">${label}</span>
        <span style="font-size:9px;color:rgba(255,255,255,0.4)">par ${declaration.user.name}</span>
      </div>`,
      iconAnchor: [40, 12],
    });
    L.marker([centerLat, centerLng], { icon, interactive: false }).addTo(map);

    // Fit bounds to show declaration
    map.fitBounds(declPolygon.getBounds().pad(0.5));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [declaration.id, courseZones]);

  return <div ref={containerRef} className="w-full h-full" />;
}
