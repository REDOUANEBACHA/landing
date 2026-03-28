"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Shot {
  club: string;
  number: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface CourseHole {
  number: number;
  par: number;
  distance: number;
  latitude: number | null;
  longitude: number | null;
  teeLat: number | null;
  teeLng: number | null;
  greenPoints: { lat: number; lng: number }[] | null;
}

interface HoleScore {
  hole: number;
  score: number;
  shots: Shot[] | null;
}

const SHOT_COLORS = [
  "#34D399", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA",
  "#FB923C", "#2DD4BF", "#E879F9", "#F87171", "#4ADE80",
];

const HOLE_COLORS = [
  "#34D399", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA",
  "#FB923C", "#2DD4BF", "#E879F9", "#F87171", "#4ADE80",
  "#38BDF8", "#FB7185", "#FACC15", "#818CF8", "#F97316",
  "#22D3EE", "#C084FC", "#EF4444",
];

function shotIcon(number: number) {
  const color = SHOT_COLORS[(number - 1) % SHOT_COLORS.length];
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#000;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    ">${number}</div>`,
  });
}

function holeIcon(number: number) {
  const color = HOLE_COLORS[(number - 1) % HOLE_COLORS.length];
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="
      width:22px;height:22px;
      background:${color};
      border:2px solid rgba(255,255,255,0.6);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:700;color:#000;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    ">${number}</div>`,
  });
}

function flagIcon() {
  return L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    html: `<div style="
      width:24px;height:24px;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    ">&#9971;</div>`,
  });
}

function teeIcon() {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="
      width:20px;height:20px;
      background:#fff;
      border:2px solid #888;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#333;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">T</div>`,
  });
}

interface ShotMapProps {
  courseCenter: [number, number];
  shots: Shot[] | null;
  courseHole: CourseHole | null;
  allScores: HoleScore[] | null;
  allCourseHoles: CourseHole[] | null;
}

export default function ShotMap({ courseCenter, shots, courseHole, allScores, allCourseHoles }: ShotMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: courseCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });
    L.control.zoom({ position: "topright" }).addTo(map);

    const mbToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${mbToken}`, {
      maxZoom: 22,
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map content
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    // Single hole view with shots
    if (shots && shots.length > 0) {
      const bounds = L.latLngBounds([]);

      // Draw green polygon
      if (courseHole?.greenPoints && courseHole.greenPoints.length > 0) {
        const greenPoly = L.polygon(
          courseHole.greenPoints.map(p => [p.lat, p.lng]),
          { color: "#34D399", fillColor: "#34D399", fillOpacity: 0.25, weight: 2 }
        ).addTo(layer);
        greenPoly.getBounds().isValid() && bounds.extend(greenPoly.getBounds());
      }

      // Draw tee marker
      if (courseHole?.teeLat && courseHole?.teeLng) {
        L.marker([courseHole.teeLat, courseHole.teeLng], { icon: teeIcon() })
          .bindTooltip("Depart", { direction: "top", offset: [0, -12], className: "shot-tooltip" })
          .addTo(layer);
        bounds.extend([courseHole.teeLat, courseHole.teeLng]);
      }

      // Draw flag at green center
      if (courseHole?.latitude && courseHole?.longitude) {
        L.marker([courseHole.latitude, courseHole.longitude], { icon: flagIcon() })
          .bindTooltip("Green", { direction: "top", offset: [0, -24], className: "shot-tooltip" })
          .addTo(layer);
        bounds.extend([courseHole.latitude, courseHole.longitude]);
      }

      // Draw shot markers
      const shotPoints: L.LatLng[] = [];
      shots.sort((a, b) => a.number - b.number).forEach((shot) => {
        const latlng = L.latLng(shot.latitude, shot.longitude);
        shotPoints.push(latlng);
        bounds.extend(latlng);

        L.marker(latlng, { icon: shotIcon(shot.number) })
          .bindTooltip(`Coup ${shot.number} - ${shot.club}`, { direction: "top", offset: [0, -16], className: "shot-tooltip" })
          .addTo(layer);
      });

      // Draw line connecting shots
      if (shotPoints.length > 1) {
        L.polyline(shotPoints, {
          color: "#34D399",
          weight: 2.5,
          opacity: 0.7,
          dashArray: "8, 6",
        }).addTo(layer);
      }

      // Connect last shot to green
      if (shotPoints.length > 0 && courseHole?.latitude && courseHole?.longitude) {
        const lastShot = shotPoints[shotPoints.length - 1];
        L.polyline([lastShot, [courseHole.latitude, courseHole.longitude]], {
          color: "#34D399",
          weight: 1.5,
          opacity: 0.4,
          dashArray: "4, 8",
        }).addTo(layer);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      }
      return;
    }

    // Overview: all holes on the course
    if (allCourseHoles && allCourseHoles.length > 0) {
      const bounds = L.latLngBounds([]);

      allCourseHoles.forEach((hole) => {
        // Green marker
        if (hole.latitude && hole.longitude) {
          const hasShots = allScores?.find(s => s.hole === hole.number)?.shots?.length;
          L.marker([hole.latitude, hole.longitude], { icon: holeIcon(hole.number) })
            .bindTooltip(
              `Trou ${hole.number} - Par ${hole.par}${hasShots ? ` (${hasShots} coups traces)` : ""}`,
              { direction: "top", offset: [0, -14], className: "shot-tooltip" }
            )
            .addTo(layer);
          bounds.extend([hole.latitude, hole.longitude]);
        }

        // Green polygon
        if (hole.greenPoints && hole.greenPoints.length > 0) {
          L.polygon(
            hole.greenPoints.map(p => [p.lat, p.lng]),
            { color: "#34D399", fillColor: "#34D399", fillOpacity: 0.15, weight: 1 }
          ).addTo(layer);
        }

        // Tee
        if (hole.teeLat && hole.teeLng) {
          bounds.extend([hole.teeLat, hole.teeLng]);
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      }
      return;
    }

    // Fallback: center on course
    map.setView(courseCenter, 15);
  }, [shots, courseHole, allScores, allCourseHoles, courseCenter]);

  return (
    <>
      <style jsx global>{`
        .shot-tooltip {
          background: rgba(13, 17, 23, 0.9) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #e5e7eb !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .shot-tooltip::before {
          border-top-color: rgba(13, 17, 23, 0.9) !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
