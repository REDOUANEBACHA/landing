"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Phone,
  Globe,
  Maximize2,
  X,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletLib = any;

// ── Mock Data ──────────────────────────────────────────────────────────

const CLUB = {
  clubName: "Golf du Chateau de Cely",
  city: "Cely",
  state: "Ile-de-France",
  country: "France",
  address: "6 Route de Saint-Germain",
  postalCode: "77930",
  latitude: 48.4665657,
  longitude: 2.524758,
  website: "https://jouer.golf/cely/",
  telephone: "+33 1 64 38 03 07",
};

const COURSE = {
  numHoles: 18,
  measure: "m",
  parsMen: [5, 4, 4, 4, 3, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4],
  indexesMen: [10, 16, 6, 14, 4, 2, 18, 8, 12, 5, 13, 3, 7, 15, 1, 11, 17, 9],
  parsWomen: [5, 4, 4, 4, 3, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4],
  indexesWomen: [10, 16, 6, 14, 4, 2, 18, 8, 12, 5, 13, 3, 7, 15, 1, 11, 17, 9],
  tees: [
    { id: "253712", name: "Noirs", color: "#999999", lengths: [444,312,327,328,215,521,143,307,315,426,318,162,328,330,603,335,145,365], crMen: 72, sMen: 139, crWomen: null, sWomen: null },
    { id: "173601", name: "Blancs", color: "#FFFFFF", lengths: [444,312,327,328,183,521,143,307,315,425,318,162,328,330,568,335,145,365], crMen: 71.6, sMen: 139, crWomen: null, sWomen: null },
    { id: "173602", name: "Jaunes", color: "#FFFF00", lengths: [409,287,305,301,146,498,123,284,286,414,307,141,300,313,551,304,133,329], crMen: 69.3, sMen: 129, crWomen: 75, sWomen: 136 },
    { id: "173603", name: "Bleus", color: "#00CCFF", lengths: [390,282,298,270,111,441,119,278,262,372,298,131,286,305,534,294,107,309], crMen: 67.6, sMen: 126, crWomen: 72.9, sWomen: 131 },
    { id: "173604", name: "Rouges", color: "#FF5050", lengths: [364,263,268,270,101,441,112,261,244,356,236,122,270,281,493,266,91,270], crMen: 65.7, sMen: 122, crWomen: 70.5, sWomen: 129 },
    { id: "253717", name: "Violets", color: "#D1ADFF", lengths: [310,250,205,265,80,380,100,250,265,310,205,100,250,265,380,265,115,250], crMen: 63.1, sMen: 119, crWomen: 67.6, sWomen: 126 },
  ],
};

const COORDS = [
  { poi:1, hole:1, lat:48.4695149, lng:2.5238665 },
  { poi:11, hole:1, lat:48.4666222, lng:2.5236165 },
  { poi:12, hole:1, lat:48.4659154, lng:2.5234234 },
  { poi:1, hole:2, lat:48.4666259, lng:2.5248063 },
  { poi:11, hole:2, lat:48.4688212, lng:2.5252012 },
  { poi:12, hole:2, lat:48.469243, lng:2.5249598 },
  { poi:1, hole:3, lat:48.4686996, lng:2.5283307 },
  { poi:11, hole:3, lat:48.4669325, lng:2.5260326 },
  { poi:12, hole:3, lat:48.4664972, lng:2.5256142 },
  { poi:1, hole:4, lat:48.4700725, lng:2.5239158 },
  { poi:11, hole:4, lat:48.4691859, lng:2.5270444 },
  { poi:12, hole:4, lat:48.4692101, lng:2.5277015 },
  { poi:1, hole:5, lat:48.4706238, lng:2.5227597 },
  { poi:11, hole:5, lat:48.4698404, lng:2.5225409 },
  { poi:12, hole:5, lat:48.4690536, lng:2.5230827 },
  { poi:1, hole:6, lat:48.4696413, lng:2.5299965 },
  { poi:11, hole:6, lat:48.4705126, lng:2.5243756 },
  { poi:12, hole:6, lat:48.4708444, lng:2.5234234 },
  { poi:1, hole:7, lat:48.4692989, lng:2.5285078 },
  { poi:11, hole:7, lat:48.4691806, lng:2.5299063 },
  { poi:12, hole:7, lat:48.4690651, lng:2.5303038 },
  { poi:1, hole:8, lat:48.4665677, lng:2.5271222 },
  { poi:11, hole:8, lat:48.4684621, lng:2.5285276 },
  { poi:12, hole:8, lat:48.4687299, lng:2.5290748 },
  { poi:1, hole:9, lat:48.4654544, lng:2.5236894 },
  { poi:11, hole:9, lat:48.4659634, lng:2.5267493 },
  { poi:12, hole:9, lat:48.4660463, lng:2.5276747 },
  { poi:1, hole:10, lat:48.4644233, lng:2.5284285 },
  { poi:11, hole:10, lat:48.464425, lng:2.5237989 },
  { poi:12, hole:10, lat:48.4645995, lng:2.5229063 },
  { poi:1, hole:11, lat:48.4633286, lng:2.5319839 },
  { poi:11, hole:11, lat:48.4638079, lng:2.5290346 },
  { poi:12, hole:11, lat:48.4639992, lng:2.5280448 },
  { poi:1, hole:12, lat:48.4640044, lng:2.5341457 },
  { poi:11, hole:12, lat:48.463229, lng:2.5331963 },
  { poi:12, hole:12, lat:48.4630446, lng:2.5326893 },
  { poi:1, hole:13, lat:48.4647141, lng:2.5291568 },
  { poi:11, hole:13, lat:48.464032, lng:2.5324732 },
  { poi:12, hole:13, lat:48.4638712, lng:2.5332349 },
  { poi:1, hole:14, lat:48.4643652, lng:2.533179 },
  { poi:11, hole:14, lat:48.4650261, lng:2.5295898 },
  { poi:12, hole:14, lat:48.46531, lng:2.5290694 },
  { poi:1, hole:15, lat:48.4685217, lng:2.5300473 },
  { poi:11, hole:15, lat:48.4651505, lng:2.5319389 },
  { poi:12, hole:15, lat:48.4648227, lng:2.5328621 },
  { poi:1, hole:16, lat:48.4659818, lng:2.5291026 },
  { poi:11, hole:16, lat:48.4682469, lng:2.5290212 },
  { poi:12, hole:16, lat:48.4688509, lng:2.5293993 },
  { poi:1, hole:17, lat:48.4651415, lng:2.5284356 },
  { poi:11, hole:17, lat:48.4658709, lng:2.5280609 },
  { poi:12, hole:17, lat:48.4663504, lng:2.5280904 },
  { poi:1, hole:18, lat:48.464947, lng:2.5235456 },
  { poi:11, hole:18, lat:48.4650379, lng:2.5270095 },
  { poi:12, hole:18, lat:48.4647935, lng:2.5282192 },
];

// ── Helpers ────────────────────────────────────────────────────────────

const HOLE_COLORS = [
  "#34D399","#60A5FA","#F472B6","#FBBF24","#A78BFA","#FB923C",
  "#2DD4BF","#E879F9","#F87171","#4ADE80","#38BDF8","#FB7185",
  "#FACC15","#818CF8","#F97316","#22D3EE","#C084FC","#EF4444",
];

function teeIcon(L: LeafletLib, hole: number, active: boolean) {
  const color = HOLE_COLORS[(hole - 1) % 18];
  const size = active ? 28 : 22;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${active ? 12 : 10}px;font-weight:700;color:#000;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:pointer">${hole}</div>`,
  });
}

function greenIcon(L: LeafletLib, _hole: number, active: boolean) {
  const size = active ? 24 : 18;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;background:#E74C3C;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${active ? 10 : 8}px;font-weight:700;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)">&#9873;</div>`,
  });
}

function fwIcon(L: LeafletLib) {
  return L.divIcon({
    className: "",
    iconSize: [8, 8],
    iconAnchor: [4, 4],
    html: `<div style="width:8px;height:8px;background:rgba(52,211,153,0.5);border:1px solid rgba(52,211,153,0.8);border-radius:50%"></div>`,
  });
}

// ── Leaflet Map Component ──────────────────────────────────────────────

function CourseMap({
  selectedHole,
  onHoleClick,
  fullscreen,
  selectedTeeIdx,
}: {
  selectedHole: number | null;
  onHoleClick: (hole: number | null) => void;
  fullscreen?: boolean;
  selectedTeeIdx: number;
}) {
  const mapRef = useRef<LeafletLib | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<LeafletLib | null>(null);
  const leafletRef = useRef<LeafletLib | null>(null);
  const onHoleClickRef = useRef(onHoleClick);
  onHoleClickRef.current = onHoleClick;
  const selectedHoleRef = useRef(selectedHole);
  selectedHoleRef.current = selectedHole;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import("leaflet").then((leaflet) => {
      if (cancelled || !containerRef.current) return;
      // @ts-expect-error -- CSS import handled by bundler
      import("leaflet/dist/leaflet.css");

      const L = leaflet.default;
      leafletRef.current = L;

      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(containerRef.current, {
        center: [CLUB.latitude, CLUB.longitude],
        zoom: 15,
        zoomControl: fullscreen ?? false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);

      mapRef.current = map;
      layersRef.current = L.layerGroup().addTo(map);

      renderLayers(L, map, layersRef.current);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const renderLayers = (L: LeafletLib, map: LeafletLib, layers: LeafletLib) => {
    layers.clearLayers();

    const holes = Array.from({ length: 18 }, (_, i) => i + 1).filter(
      (h) => !selectedHole || h === selectedHole
    );

    for (const h of holes) {
      const tee = COORDS.find((c) => c.hole === h && c.poi === 1);
      const green = COORDS.find((c) => c.hole === h && c.poi === 12);
      const fw = COORDS.find((c) => c.hole === h && c.poi === 11);
      const isActive = selectedHole === h;
      const color = HOLE_COLORS[(h - 1) % 18];

      if (tee && green) {
        L.polyline([[tee.lat, tee.lng], [green.lat, green.lng]], {
          color, weight: isActive ? 3 : 2, dashArray: "6 4", opacity: isActive ? 1 : 0.6,
        }).addTo(layers);

        if (isActive) {
          const dist = COURSE.tees[selectedTeeIdx].lengths[h - 1];
          const midLat = (tee.lat + green.lat) / 2;
          const midLng = (tee.lng + green.lng) / 2;
          L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: "",
              iconAnchor: [20, 10],
              html: `<div style="background:rgba(0,0,0,0.75);color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,0.3);white-space:nowrap">${dist}m</div>`,
            }),
          }).addTo(layers);
        }
      }

      if (tee && isActive && green) {
        // Show colored tee zones along the tee→green line
        const maxLen = COURSE.tees[0].lengths[h - 1]; // longest tee (Noirs)
        for (const t of COURSE.tees) {
          const ratio = (maxLen - t.lengths[h - 1]) / maxLen;
          const lat = tee.lat + (green.lat - tee.lat) * ratio;
          const lng = tee.lng + (green.lng - tee.lng) * ratio;
          const isSel = COURSE.tees[selectedTeeIdx].id === t.id;
          const sz = isSel ? 18 : 12;
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: "",
              iconSize: [sz, sz],
              iconAnchor: [sz / 2, sz / 2],
              html: `<div style="width:${sz}px;height:${sz}px;background:${t.color};border:2px solid ${isSel ? '#fff' : 'rgba(255,255,255,0.4)'};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
            }),
          }).addTo(layers);
        }
      }

      if (tee) {
        const m = L.marker([tee.lat, tee.lng], { icon: teeIcon(L, h, isActive) }).addTo(layers);
        m.on("click", () => onHoleClickRef.current(selectedHoleRef.current === h ? null : h));
      }
      if (green) {
        L.marker([green.lat, green.lng], { icon: greenIcon(L, h, isActive) }).addTo(layers);
      }
      if (fw && (fullscreen || selectedHole)) {
        L.marker([fw.lat, fw.lng], { icon: fwIcon(L) }).addTo(layers);
      }
    }

    if (selectedHole) {
      const tee = COORDS.find((c) => c.hole === selectedHole && c.poi === 1);
      const green = COORDS.find((c) => c.hole === selectedHole && c.poi === 12);
      if (tee && green) {
        map.fitBounds([[tee.lat, tee.lng], [green.lat, green.lng]], { padding: [60, 60], maxZoom: 17 });
      }
    } else {
      const all = COORDS.map((c) => [c.lat, c.lng] as [number, number]);
      if (all.length) map.fitBounds(all, { padding: [30, 30] });
    }
  };

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!L || !map || !layers) return;
    renderLayers(L, map, layers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHole, fullscreen, selectedTeeIdx]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function TestPage() {
  const [selectedTee, setSelectedTee] = useState(2);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const tee = COURSE.tees[selectedTee];
  const totalPar = COURSE.parsMen.reduce((a, b) => a + b, 0);
  const totalLen = tee.lengths.reduce((a, b) => a + b, 0);
  const f9Par = COURSE.parsMen.slice(0, 9).reduce((a, b) => a + b, 0);
  const b9Par = COURSE.parsMen.slice(9).reduce((a, b) => a + b, 0);
  const f9Len = tee.lengths.slice(0, 9).reduce((a, b) => a + b, 0);
  const b9Len = tee.lengths.slice(9).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* ═══ CLUB INFO ═══ */}
      <div className="card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-semibold text-white leading-snug tracking-tight">
              {CLUB.clubName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[13px] text-gray-500">
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent/60" />{CLUB.address}, {CLUB.postalCode} {CLUB.city}</span>
              <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-accent/60" />{CLUB.state}, {CLUB.country}</span>
            </div>
            <div className="flex gap-2 mt-4">
              <a href={`tel:${CLUB.telephone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/10 text-accent text-[12px] font-medium hover:bg-accent/[0.12] transition-colors">
                <Phone className="w-3.5 h-3.5" /> {CLUB.telephone}
              </a>
              <a href={CLUB.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/10 text-accent text-[12px] font-medium hover:bg-accent/[0.12] transition-colors">
                <Globe className="w-3.5 h-3.5" /> Site web
              </a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { val: "18", label: "Trous" },
              { val: String(totalPar), label: "Par" },
              { val: `${totalLen}m`, label: "Distance" },
              { val: String(COURSE.tees.length), label: "Departs" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center px-4 py-3 rounded-xl bg-white/[0.03]">
                <span className="text-lg sm:text-xl font-bold text-accent">{b.val}</span>
                <span className="text-[11px] text-gray-500 mt-0.5">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TEE SELECTOR ═══ */}
      <div className="card rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Departs</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {COURSE.tees.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setSelectedTee(i)}
              className={`flex flex-col items-center min-w-[90px] px-4 py-3 rounded-xl border transition-all duration-200 ${
                selectedTee === i
                  ? "border-accent/40 bg-accent/[0.06]"
                  : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="w-4 h-4 rounded-full mb-2 border border-black/20" style={{ backgroundColor: t.color }} />
              <span className="text-[13px] font-semibold text-white">{t.name}</span>
              <span className="text-[11px] text-gray-500 mt-0.5">CR {t.crMen} / S {t.sMen}</span>
              {t.crWomen && (
                <span className="text-[10px] text-pink-400/70 mt-0.5">CR {t.crWomen} / S {t.sWomen}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ HOLES TABLE ═══ */}
      <div className="card rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Detail des trous — <span style={{ color: tee.color === "#FFFFFF" ? "#ccc" : tee.color }}>{tee.name}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="py-2 text-left text-gray-500 font-medium w-12">N</th>
                <th className="py-2 text-center text-gray-500 font-medium">Par</th>
                <th className="py-2 text-center text-gray-500 font-medium">HCP</th>
                <th className="py-2 text-center text-gray-500 font-medium">Dist</th>
                <th className="py-2 text-center text-gray-500 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {COURSE.parsMen.map((par, i) => {
                const h = i + 1;
                const active = selectedHole === h;
                return (
                  <tr
                    key={i}
                    onClick={() => setSelectedHole(active ? null : h)}
                    className={`border-b border-white/[0.03] cursor-pointer transition-colors ${
                      active ? "bg-accent/[0.06]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-2 font-bold" style={{ color: HOLE_COLORS[i] }}>{h}</td>
                    <td className="py-2 text-center text-gray-300 font-semibold">{par}</td>
                    <td className="py-2 text-center text-gray-500">{COURSE.indexesMen[i]}</td>
                    <td className="py-2 text-center text-gray-400">{tee.lengths[i]}m</td>
                    <td className="py-2 text-center">
                      <MapPin className={`w-3.5 h-3.5 inline ${active ? "text-accent" : "text-gray-700"}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.12]">
                <td className="py-2 font-bold text-accent">Tot</td>
                <td className="py-2 text-center font-bold text-accent">{totalPar}</td>
                <td className="py-2 text-center text-gray-600">--</td>
                <td className="py-2 text-center font-bold text-accent">{totalLen}m</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03]">
            <span className="text-[11px] text-gray-500">Aller (1-9)</span>
            <span className="text-[13px] font-bold text-white mt-1">Par {f9Par} - {f9Len}m</span>
          </div>
          <div className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03]">
            <span className="text-[11px] text-gray-500">Retour (10-18)</span>
            <span className="text-[13px] font-bold text-white mt-1">Par {b9Par} - {b9Len}m</span>
          </div>
        </div>
      </div>

      {/* ═══ MAP ═══ */}
      <div className="card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Carte du parcours{selectedHole ? ` — Trou ${selectedHole}` : ""}
          </h2>
          <div className="flex items-center gap-2">
            {selectedHole && (
              <button onClick={() => setSelectedHole(null)} className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-dark transition-colors">
                <X className="w-3 h-3" /> Tous
              </button>
            )}
            <button onClick={() => setMapFullscreen(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-gray-400 hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHole(selectedHole === h ? null : h)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                selectedHole === h ? "border-transparent text-dark" : "border-white/[0.06] text-gray-500 hover:text-white bg-white/[0.03]"
              }`}
              style={selectedHole === h ? { backgroundColor: HOLE_COLORS[h - 1] } : undefined}
            >
              {h}
            </button>
          ))}
        </div>

        <div className="relative rounded-xl overflow-hidden border border-white/[0.06]" style={{ height: 480 }}>
          <CourseMap selectedHole={selectedHole} onHoleClick={setSelectedHole} selectedTeeIdx={selectedTee} />
        </div>

        <div className="flex items-center justify-center gap-5 mt-3 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-accent border border-white/60 inline-block" /> Depart
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white/60 inline-block" /> Green
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent/50 inline-block" /> Fairway
          </span>
        </div>
      </div>

      {/* ═══ SELECTED HOLE DETAIL ═══ */}
      {selectedHole && (
        <div className="card-premium rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-dark"
              style={{ backgroundColor: HOLE_COLORS[(selectedHole - 1) % 18] }}
            >
              {selectedHole}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Trou {selectedHole}</h3>
              <span className="text-[12px] text-gray-500">Par {COURSE.parsMen[selectedHole - 1]} - HCP {COURSE.indexesMen[selectedHole - 1]}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {COURSE.tees.map((t) => (
              <div key={t.id} className="flex flex-col items-center py-2 px-2 rounded-lg bg-white/[0.03]">
                <div className="w-3 h-3 rounded-full mb-1 border border-black/20" style={{ backgroundColor: t.color }} />
                <span className="text-[12px] font-bold text-white">{t.lengths[selectedHole - 1]}m</span>
                <span className="text-[10px] text-gray-600">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ FULLSCREEN MAP MODAL ═══ */}
      {mapFullscreen && (
        <div className="fixed inset-0 z-50 bg-dark flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-white/[0.04]">
            <button onClick={() => setMapFullscreen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-[15px] font-semibold text-white flex-1">
              {CLUB.clubName}{selectedHole ? ` — Trou ${selectedHole}` : ""}
            </h3>
            {selectedHole && (
              <button onClick={() => setSelectedHole(null)} className="text-[12px] text-accent font-medium">Tous les trous</button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 bg-surface">
            {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHole(selectedHole === h ? null : h)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border transition-all ${
                  selectedHole === h ? "border-transparent text-dark" : "border-white/[0.06] text-gray-500 hover:text-white"
                }`}
                style={selectedHole === h ? { backgroundColor: HOLE_COLORS[h - 1] } : undefined}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <CourseMap selectedHole={selectedHole} onHoleClick={setSelectedHole} fullscreen selectedTeeIdx={selectedTee} />
          </div>
        </div>
      )}
    </div>
  );
}
