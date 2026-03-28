"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  MapPin,
  Clock,
  Wind,
  Thermometer,
  Eye,
  Flag,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

const API = process.env.NEXT_PUBLIC_API_URL!;

/* ---- Types ---- */
interface User {
  id: string;
  name: string;
  email: string;
  handicap: number;
  avatarUrl: string | null;
}

interface Shot {
  club: string;
  number: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface HoleScore {
  id: string;
  hole: number;
  score: number;
  putts: number;
  fairway: boolean | null;
  gir: boolean | null;
  shots: Shot[] | null;
}

interface Course {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  holes: number;
  par: number;
  imageUrl: string | null;
  courseHoles?: {
    number: number;
    par: number;
    distance: number;
    latitude: number | null;
    longitude: number | null;
    teeLat: number | null;
    teeLng: number | null;
    greenPoints: { lat: number; lng: number }[] | null;
  }[];
}

interface Round {
  id: string;
  userId: string;
  courseId: string;
  date: string;
  totalScore: number;
  totalPar: number;
  weather: string | null;
  notes: string | null;
  status: string;
  scores: HoleScore[];
  course: Course;
}

/* ---- Shot Map (Leaflet, dynamic import) ---- */
const ShotMap = dynamic(() => import("./ShotMap") as Promise<{ default: React.ComponentType<ShotMapProps> }>, { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div> });

interface ShotMapProps {
  courseCenter: [number, number];
  shots: Shot[] | null;
  courseHole: {
    number: number;
    par: number;
    distance: number;
    latitude: number | null;
    longitude: number | null;
    teeLat: number | null;
    teeLng: number | null;
    greenPoints: { lat: number; lng: number }[] | null;
  } | null;
  allScores: HoleScore[] | null;
  allCourseHoles: {
    number: number;
    par: number;
    distance: number;
    latitude: number | null;
    longitude: number | null;
    teeLat: number | null;
    teeLng: number | null;
    greenPoints: { lat: number; lng: number }[] | null;
  }[] | null;
}

/* ---- Score color helper ---- */
function scoreColor(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "text-yellow-400";
  if (diff === -1) return "text-red-400";
  if (diff === 0) return "text-gray-200";
  if (diff === 1) return "text-blue-400";
  return "text-blue-600";
}

function scoreBg(score: number, par: number) {
  const diff = score - par;
  if (diff <= -2) return "bg-yellow-500/20 border-yellow-500/30";
  if (diff === -1) return "bg-red-500/15 border-red-500/20";
  if (diff === 0) return "bg-white/[0.03] border-white/[0.06]";
  if (diff === 1) return "bg-blue-500/15 border-blue-500/20";
  return "bg-blue-900/20 border-blue-700/20";
}

/* ---- Weather decoder ---- */
function weatherIcon(code: number) {
  if (code <= 1) return "Ensoleille";
  if (code <= 3) return "Nuageux";
  if (code <= 48) return "Brouillard";
  if (code <= 67) return "Pluie";
  if (code <= 77) return "Neige";
  return "Orage";
}

/* ---- Main Page ---- */
export default function ParcoursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");

  // Selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Selected round
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [activeHole, setActiveHole] = useState<number | null>(null);

  /* Fetch users */
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setUsers(await (await fetch(`${API}/users`)).json());
    } catch {}
    finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* Fetch rounds for user */
  const fetchRounds = useCallback(async (userId: string) => {
    setLoadingRounds(true);
    try {
      setRounds(await (await fetch(`${API}/rounds?userId=${userId}`)).json());
    } catch {}
    finally { setLoadingRounds(false); }
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedRound(null);
    setActiveHole(null);
    fetchRounds(user.id);
  };

  const handleSelectRound = (round: Round) => {
    setSelectedRound(round);
    setActiveHole(null);
  };

  const handleBack = () => {
    if (selectedRound) { setSelectedRound(null); setActiveHole(null); }
    else if (selectedUser) { setSelectedUser(null); setRounds([]); }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  /* ---- Render: Round Detail ---- */
  if (selectedRound) {
    const weather = selectedRound.weather ? JSON.parse(selectedRound.weather) : null;
    const totalPar = selectedRound.scores.reduce((sum, s) => {
      const ch = selectedRound.course.courseHoles?.find(h => h.number === s.hole);
      return sum + (ch?.par ?? 4);
    }, 0);
    const totalScore = selectedRound.scores.reduce((sum, s) => sum + s.score, 0);
    const diff = totalScore - totalPar;
    const totalPutts = selectedRound.scores.reduce((sum, s) => sum + (s.putts ?? 0), 0);
    const shotsCount = selectedRound.scores.reduce((sum, s) => sum + (s.shots?.length ?? 0), 0);

    // Current hole shots for map
    const currentHoleScore = activeHole != null ? selectedRound.scores.find(s => s.hole === activeHole) : null;
    const currentCourseHole = activeHole != null ? selectedRound.course.courseHoles?.find(h => h.number === activeHole) : null;

    return (
      <>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-gray-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white tracking-tight">{selectedRound.course.name}</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {selectedUser?.name} &middot; {new Date(selectedRound.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[11px] font-medium ${selectedRound.status === "playing" ? "bg-yellow-500/20 text-yellow-400" : "bg-accent/20 text-accent"}`}>
                {selectedRound.status === "playing" ? "En cours" : "Termine"}
              </span>
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Score</p>
            <p className="text-lg font-bold text-white">{totalScore} <span className="text-[13px] font-normal text-gray-500">/ {totalPar}</span></p>
            <p className={`text-[12px] font-medium ${diff < 0 ? "text-red-400" : diff === 0 ? "text-gray-400" : "text-blue-400"}`}>
              {diff > 0 ? `+${diff}` : diff === 0 ? "E" : diff}
            </p>
          </div>
          <div className="card rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Putts</p>
            <p className="text-lg font-bold text-white">{totalPutts}</p>
            <p className="text-[12px] text-gray-500">{(totalPutts / selectedRound.scores.length).toFixed(1)} / trou</p>
          </div>
          <div className="card rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Coups traces</p>
            <p className="text-lg font-bold text-white">{shotsCount}</p>
            <p className="text-[12px] text-gray-500">{selectedRound.scores.filter(s => s.shots && s.shots.length > 0).length} trous avec GPS</p>
          </div>
          {weather && (
            <div className="card rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Meteo</p>
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[13px] text-gray-200">{weather.temp}°C</span>
                <Wind className="w-3.5 h-3.5 text-gray-500 ml-1" />
                <span className="text-[13px] text-gray-200">{weather.wind} km/h</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">{weatherIcon(weather.code)}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Scorecard */}
          <div className="flex-1">
            <div className="card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <h2 className="text-sm font-semibold text-white">Carte de score</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Trou</th>
                      <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Par</th>
                      <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Score</th>
                      <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Putts</th>
                      <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Clubs</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRound.scores
                      .sort((a, b) => a.hole - b.hole)
                      .map((s) => {
                        const ch = selectedRound.course.courseHoles?.find(h => h.number === s.hole);
                        const par = ch?.par ?? 4;
                        const hasShots = s.shots && s.shots.length > 0;
                        const isActive = activeHole === s.hole;

                        return (
                          <tr
                            key={s.hole}
                            className={`border-b border-white/[0.02] transition-colors cursor-pointer ${isActive ? "bg-accent/[0.06]" : "hover:bg-white/[0.02]"}`}
                            onClick={() => setActiveHole(isActive ? null : s.hole)}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-gray-300">{s.hole}</span>
                                {ch?.distance && <span className="text-[11px] text-gray-600">{ch.distance}m</span>}
                              </div>
                            </td>
                            <td className="text-center px-3 py-2.5 text-[13px] text-gray-500">{par}</td>
                            <td className="text-center px-3 py-2.5">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-[13px] font-bold ${scoreBg(s.score, par)} ${scoreColor(s.score, par)}`}>
                                {s.score}
                              </span>
                            </td>
                            <td className="text-center px-3 py-2.5 text-[13px] text-gray-400">{s.putts}</td>
                            <td className="text-center px-3 py-2.5">
                              {hasShots ? (
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {s.shots!.map((shot, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] font-medium text-gray-400">
                                      {shot.club}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-700">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5">
                              {hasShots && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActiveHole(isActive ? null : s.hole); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isActive ? "bg-accent/20 text-accent" : "hover:bg-white/[0.04] text-gray-600 hover:text-accent"}`}
                                  title="Voir sur la carte"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.06]">
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-300">Total</td>
                      <td className="text-center px-3 py-3 text-[12px] font-semibold text-gray-400">{totalPar}</td>
                      <td className="text-center px-3 py-3 text-[13px] font-bold text-white">{totalScore}</td>
                      <td className="text-center px-3 py-3 text-[12px] font-semibold text-gray-400">{totalPutts}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Map panel */}
          <div className="lg:w-[480px] shrink-0">
            <div className="card rounded-xl overflow-hidden sticky top-20">
              <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  {activeHole != null ? `Trou ${activeHole} - Trace des coups` : "Carte du parcours"}
                </h2>
                {activeHole != null && (
                  <button onClick={() => setActiveHole(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.04] text-gray-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="h-[420px]">
                <ShotMap
                  courseCenter={[selectedRound.course.latitude, selectedRound.course.longitude]}
                  shots={currentHoleScore?.shots ?? null}
                  courseHole={currentCourseHole ?? null}
                  allScores={activeHole == null ? selectedRound.scores : null}
                  allCourseHoles={activeHole == null ? (selectedRound.course.courseHoles ?? null) : null}
                />
              </div>
              {/* Shot detail list */}
              {currentHoleScore?.shots && currentHoleScore.shots.length > 0 && (
                <div className="border-t border-white/[0.04] px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
                  {currentHoleScore.shots.map((shot, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">{shot.number}</span>
                      <span className="text-[13px] font-medium text-gray-200 w-12">{shot.club}</span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(shot.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span className="text-[11px] text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {shot.latitude.toFixed(5)}, {shot.longitude.toFixed(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---- Render: Rounds list for a user ---- */
  if (selectedUser) {
    return (
      <>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-gray-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[13px] font-bold overflow-hidden">
              {selectedUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                selectedUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">{selectedUser.name}</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">Handicap {selectedUser.handicap} &middot; {rounds.length} parcours</p>
            </div>
          </div>
        </div>

        {loadingRounds ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>
        ) : rounds.length === 0 ? (
          <div className="card rounded-xl px-6 py-12 text-center">
            <Flag className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500">Aucun parcours enregistre</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {rounds
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((round) => {
                const weather = round.weather ? JSON.parse(round.weather) : null;
                const totalScore = round.scores.reduce((s, h) => s + h.score, 0);
                const totalPar = round.scores.reduce((s, h) => {
                  const ch = round.course.courseHoles?.find(c => c.number === h.hole);
                  return s + (ch?.par ?? 4);
                }, 0);
                const diff = totalScore - totalPar;
                const shotsTracked = round.scores.filter(s => s.shots && s.shots.length > 0).length;

                return (
                  <div
                    key={round.id}
                    onClick={() => handleSelectRound(round)}
                    className="card rounded-xl px-5 py-4 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {round.course.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={round.course.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Flag className="w-5 h-5 text-accent" />
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-medium text-gray-200 group-hover:text-white transition-colors">{round.course.name}</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">
                            {round.course.city}, {round.course.country} &middot; {round.course.holes} trous &middot;{" "}
                            {new Date(round.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${round.status === "playing" ? "bg-yellow-500/20 text-yellow-400" : "bg-accent/20 text-accent"}`}>
                              {round.status === "playing" ? "En cours" : "Termine"}
                            </span>
                            {shotsTracked > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <MapPin className="w-3 h-3" /> {shotsTracked} trous traces
                              </span>
                            )}
                            {weather && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Thermometer className="w-3 h-3" /> {weather.temp}°C
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{totalScore}</p>
                        <p className={`text-[13px] font-medium ${diff < 0 ? "text-red-400" : diff === 0 ? "text-gray-400" : "text-blue-400"}`}>
                          {diff > 0 ? `+${diff}` : diff === 0 ? "E" : diff}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </>
    );
  }

  /* ---- Render: Users list ---- */
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Parcours</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Consultez les parcours et le trace des coups de chaque joueur</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          placeholder="Rechercher un joueur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors"
        />
      </div>

      <div className="card rounded-xl overflow-hidden">
        {loadingUsers ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Joueur</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="text-center px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Handicap</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[12px] font-bold shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-[13px] font-medium text-gray-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-gray-400">{u.email}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-400 text-center">{u.handicap}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end">
                        <span className="text-[12px] text-gray-600 group-hover:text-accent flex items-center gap-1">
                          Voir parcours <ChevronLeft className="w-3 h-3 rotate-180" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
