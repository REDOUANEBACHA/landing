"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Search,
  MapPin,
  User,
  Calendar,
  MessageSquare,
  Droplets,
  Trees,
  Circle,
  Construction,
  Ban,
  Eye,
  ChevronLeft,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL!;
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "golf-admin-secret";

interface Declaration {
  id: string;
  courseId: string;
  userId: string;
  type: string;
  points: { lat: number; lng: number }[];
  message: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; name: string; city: string };
}

interface CourseZone {
  id: string;
  type: string;
  points: { lat: number; lng: number }[];
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; mapColor: string; icon: React.ReactNode }> = {
  danger: { label: "Danger", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", mapColor: "#FF4444", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ob: { label: "OB", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", mapColor: "#FF5050", icon: <Ban className="w-3.5 h-3.5" /> },
  water: { label: "Eau", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", mapColor: "#4488FF", icon: <Droplets className="w-3.5 h-3.5" /> },
  bunker: { label: "Bunker", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", mapColor: "#DCC864", icon: <Circle className="w-3.5 h-3.5" /> },
  trees: { label: "Arbres", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", mapColor: "#3C8C3C", icon: <Trees className="w-3.5 h-3.5" /> },
  repair: { label: "Travaux", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", mapColor: "#FFA500", icon: <Construction className="w-3.5 h-3.5" /> },
};

const ZONE_COLORS: Record<string, string> = {
  ob: "#FF5050",
  water: "#4488FF",
  bunker: "#DCC864",
  trees: "#228B22",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "text-amber-400", bg: "bg-amber-500/10" },
  approved: { label: "Approuvee", color: "text-green-400", bg: "bg-green-500/10" },
  rejected: { label: "Refusee", color: "text-red-400", bg: "bg-red-500/10" },
};

function adminFetch(path: string, options?: RequestInit) {
  return fetch(`${API}/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
      ...(options?.headers ?? {}),
    },
  });
}

function apiFetch(path: string) {
  return fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
}

// Leaflet map component (dynamic import to avoid SSR issues)
const DeclarationMap = dynamic(() => import("./DeclarationMap"), { ssr: false });

export default function DeclarationsPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Declaration | null>(null);
  const [courseZones, setCourseZones] = useState<CourseZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/declarations?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setDeclarations(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  // Load course zones when a declaration is selected
  useEffect(() => {
    if (!selected) { setCourseZones([]); return; }
    setZonesLoading(true);
    apiFetch(`/courses/${selected.courseId}/zones`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCourseZones(data))
      .catch(() => setCourseZones([]))
      .finally(() => setZonesLoading(false));
  }, [selected?.courseId]);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/declarations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setDeclarations((prev) => prev.filter((d) => d.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette declaration ?")) return;
    setActionLoading(id);
    try {
      const res = await adminFetch(`/declarations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeclarations((prev) => prev.filter((d) => d.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = declarations.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.user.name.toLowerCase().includes(q) ||
      d.course.name.toLowerCase().includes(q) ||
      d.course.city.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      (d.message && d.message.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-56px-48px)]">
      {/* Left panel: list */}
      <div className={`flex flex-col ${selected ? "w-96 shrink-0" : "flex-1"} transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Declarations</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Signalements des utilisateurs</p>
          </div>
          {filter === "pending" && filtered.length > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
              {filtered.length}
            </span>
          )}
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            {(["pending", "approved", "rejected"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setFilter(s); setSelected(null); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    filter === s ? `${cfg.bg} ${cfg.color}` : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-[11px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-accent/30"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucune declaration {STATUS_CONFIG[filter].label.toLowerCase()}</p>
            </div>
          ) : (
            filtered.map((d) => {
              const typeCfg = TYPE_CONFIG[d.type] || TYPE_CONFIG.danger;
              const isLoading = actionLoading === d.id;
              const isSelected = selected?.id === d.id;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? `bg-white/[0.06] border ${typeCfg.border}`
                      : "bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]"
                  }`}
                >
                  {/* Type badge */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg ${typeCfg.bg} flex items-center justify-center ${typeCfg.color}`}>
                    {typeCfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[11px] font-bold ${typeCfg.color}`}>{typeCfg.label}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-[11px] text-gray-500">{d.course.name}</span>
                    </div>
                    {d.message && (
                      <p className="text-[11px] text-gray-400 truncate mb-1">{d.message}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{d.user.name}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    ) : filter === "pending" ? (
                      <>
                        <button onClick={() => handleAction(d.id, "approved")} className="w-7 h-7 rounded-lg bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-400 transition-colors" title="Approuver">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleAction(d.id, "rejected")} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors" title="Refuser">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleDelete(d.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors" title="Supprimer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: map + detail */}
      {selected && (
        <div className="flex-1 flex flex-col rounded-2xl border border-white/[0.04] overflow-hidden bg-white/[0.02]">
          {/* Detail header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-surface/50">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-gray-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`${(TYPE_CONFIG[selected.type] || TYPE_CONFIG.danger).color} font-semibold text-sm`}>
                    {(TYPE_CONFIG[selected.type] || TYPE_CONFIG.danger).label}
                  </span>
                  <span className="text-gray-600 text-xs">par {selected.user.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {selected.course.name}, {selected.course.city}
                  <span className="text-gray-700">·</span>
                  {new Date(selected.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {filter === "pending" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(selected.id, "approved")}
                  disabled={actionLoading === selected.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[12px] font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approuver
                </button>
                <button
                  onClick={() => handleAction(selected.id, "rejected")}
                  disabled={actionLoading === selected.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[12px] font-semibold transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Refuser
                </button>
              </div>
            )}
          </div>

          {/* Message */}
          {selected.message && (
            <div className="px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                <p className="text-[12px] text-gray-400 leading-relaxed">{selected.message}</p>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative">
            {zonesLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark/50">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            )}
            <DeclarationMap
              declaration={selected}
              courseZones={courseZones}
              typeConfig={TYPE_CONFIG}
              zoneColors={ZONE_COLORS}
            />
          </div>
        </div>
      )}
    </div>
  );
}
