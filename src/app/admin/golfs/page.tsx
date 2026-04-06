"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Save,
  Loader2,
  Upload,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";

const HoleMap = dynamic(() => import("@/components/HoleMap"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL!;
const GOLF_API = "https://golfapi.io/api/v2.3";
const GOLF_API_KEY = "11389321-81c0-4a58-8573-d7ca3d6f298a";

function golfApiFetch(path: string) {
  return fetch(`${GOLF_API}${path}`, {
    headers: { Authorization: `Bearer ${GOLF_API_KEY}` },
  });
}

/* ---- Types ---- */
interface CourseHole {
  id: string;
  number: number;
  par: number;
  distance: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface CourseTee {
  id: string;
  name: string;
  color: string;
  lengths: number[];
  crMen: number | null;
  sMen: number | null;
  crWomen: number | null;
  sWomen: number | null;
  golfApiTeeId?: string;
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
  rating: number | null;
  courseHoles?: CourseHole[];
  courseTees?: CourseTee[];
}

interface GeoResult {
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

/* ---- Golf API Types ---- */
interface GolfApiClub {
  clubID: string;
  clubName: string;
  city: string;
  state: string;
  country: string;
  courses: { courseID: string; courseName: string; numHoles: number; hasGPS: number }[];
}

interface GolfApiCourse {
  clubID: string;
  clubName: string;
  address: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  website: string;
  telephone: string;
  courseID: string;
  courseName: string;
  numHoles: string;
  measure: string;
  parsMen: number[];
  indexesMen: number[];
  parsWomen: number[];
  indexesWomen: number[];
  tees: {
    teeID: string;
    teeName: string;
    teeColor: string;
    courseRatingMen: number | string;
    slopeMen: number | string;
    courseRatingWomen: number | string;
    slopeWomen: number | string;
    [key: string]: unknown; // length1..length18
  }[];
}

interface GolfApiCoord {
  poi: number;
  hole: number;
  latitude: string;
  longitude: string;
  location: number;
  sideFW: number;
}

/* ---- Course Form Modal ---- */
function CourseModal({
  course,
  onClose,
  onSaved,
}: {
  course: Course | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!course;
  const initialHolesCount = course?.holes ?? 18;
  const [form, setForm] = useState({
    name: course?.name ?? "",
    city: course?.city ?? "",
    country: course?.country ?? "France",
    latitude: course?.latitude ?? 0,
    longitude: course?.longitude ?? 0,
    holes: initialHolesCount,
    par: course?.par ?? 72,
    imageUrl: course?.imageUrl ?? "",
    rating: course?.rating ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const buildInitialHoles = () => {
    if (course?.courseHoles && course.courseHoles.length > 0) {
      return course.courseHoles.map((h: any) => ({
        number: h.number, par: h.par, distance: h.distance,
        latitude: h.latitude ?? null, longitude: h.longitude ?? null,
        teeLat: h.teeLat ?? null, teeLng: h.teeLng ?? null,
        greenPoints: h.greenPoints ?? null,
        waypoints: h.waypoints ?? null,
      }));
    }
    return Array.from({ length: initialHolesCount }, (_, i) => ({
      number: i + 1, par: 4, distance: 300, latitude: null as number | null, longitude: null as number | null,
      teeLat: null as number | null, teeLng: null as number | null,
      greenPoints: null as { lat: number; lng: number }[] | null,
      waypoints: null as { lat: number; lng: number }[] | null,
    }));
  };
  const [courseHoles, setCourseHoles] = useState(buildInitialHoles);
  const [activeHoleIndex, setActiveHoleIndex] = useState(0);
  const [holeTool, setHoleTool] = useState<"green" | "tee">("green");
  const [courseZones, setCourseZones] = useState<{ type: string; points: { lat: number; lng: number }[]; id?: string }[]>([]);
  const [zonesLoaded, setZonesLoaded] = useState(false);

  // Load existing zones when editing
  useEffect(() => {
    if (!isEdit || zonesLoaded) return;
    fetch(`${API}/courses/${course.id}/zones`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCourseZones(data))
      .catch(() => {})
      .finally(() => setZonesLoaded(true));
  }, [isEdit, zonesLoaded]);

  const updateHolesCount = (count: number) => {
    const n = Math.max(1, Math.min(36, count));
    setForm((f) => ({ ...f, holes: n }));
    setCourseHoles((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({
          number: prev.length + i + 1, par: 4, distance: 300, latitude: null as number | null, longitude: null as number | null, teeLat: null as number | null, teeLng: null as number | null, greenPoints: null as { lat: number; lng: number }[] | null, waypoints: null as { lat: number; lng: number }[] | null,
        }))];
      }
      return prev.slice(0, n);
    });
    if (activeHoleIndex >= n) setActiveHoleIndex(n - 1);
  };

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const recalcDistances = (holes: typeof courseHoles) => {
    return holes.map((hole, i) => {
      const next = holes[i + 1];
      if (hole.latitude != null && hole.longitude != null && next?.latitude != null && next?.longitude != null) {
        return { ...hole, distance: haversine(hole.latitude, hole.longitude, next.latitude, next.longitude) };
      }
      return hole;
    });
  };

  const updateHole = (index: number, field: "par" | "distance", value: number) => {
    setCourseHoles((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const handleHolePositioned = useCallback((holeIndex: number, lat: number, lng: number) => {
    setCourseHoles((prev) => {
      const updated = prev.map((h, i) => (i === holeIndex ? { ...h, latitude: lat, longitude: lng } : h));
      return recalcDistances(updated);
    });
    setActiveHoleIndex((prev) => {
      const next = holeIndex + 1;
      return next < courseHoles.length ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseHoles.length]);

  const handleTeePositioned = useCallback((holeIndex: number, lat: number, lng: number) => {
    setCourseHoles((prev) => prev.map((h, i) => (i === holeIndex ? { ...h, teeLat: lat, teeLng: lng } : h)));
    setActiveHoleIndex((prev) => {
      const next = holeIndex + 1;
      return next < courseHoles.length ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseHoles.length]);

  // Golf API import state
  const [apiSearch, setApiSearch] = useState("");
  const [apiResults, setApiResults] = useState<GolfApiClub[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiImported, setApiImported] = useState(false);
  const [courseTees, setCourseTees] = useState<{ name: string; color: string; lengths: number[]; crMen: number | null; sMen: number | null; crWomen: number | null; sWomen: number | null; golfApiTeeId: string }[]>(() => {
    if (course?.courseTees && course.courseTees.length > 0) {
      return course.courseTees.map((t) => ({
        name: t.name,
        color: t.color,
        lengths: t.lengths,
        crMen: t.crMen,
        sMen: t.sMen,
        crWomen: t.crWomen,
        sWomen: t.sWomen,
        golfApiTeeId: t.golfApiTeeId || "",
      }));
    }
    return [];
  });
  const apiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchGolfApi = async (query: string) => {
    if (!query.trim() || query.trim().length < 3) { setApiResults([]); return; }
    setApiLoading(true);
    try {
      const res = await golfApiFetch(`/clubs?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      setApiResults(data.clubs || []);
    } catch { setError("Erreur de recherche Golf API"); }
    finally { setApiLoading(false); }
  };

  const handleApiSearchChange = (value: string) => {
    setApiSearch(value);
    if (apiDebounceRef.current) clearTimeout(apiDebounceRef.current);
    apiDebounceRef.current = setTimeout(() => searchGolfApi(value), 400);
  };

  const importFromGolfApi = async (_clubId: string, courseId: string) => {
    setApiLoading(true);
    setError("");
    try {
      // Fetch course details and coordinates in parallel
      const [courseRes, coordsRes] = await Promise.all([
        golfApiFetch(`/courses/${courseId}?measureUnit=m`),
        golfApiFetch(`/coordinates/${courseId}`),
      ]);
      const courseData: GolfApiCourse = await courseRes.json();
      const coordsData = await coordsRes.json();
      const coords: GolfApiCoord[] = coordsData.coordinates || [];

      const numHoles = parseInt(courseData.numHoles) || 18;

      // Fill form
      setForm((f) => ({
        ...f,
        name: courseData.clubName + (courseData.courseName && courseData.courseName !== courseData.clubName ? ` - ${courseData.courseName}` : ""),
        city: courseData.city || f.city,
        country: courseData.country || f.country,
        latitude: parseFloat(courseData.latitude) || f.latitude,
        longitude: parseFloat(courseData.longitude) || f.longitude,
        holes: numHoles,
        par: courseData.parsMen?.reduce((a, b) => a + b, 0) || f.par,
      }));

      // Build holes with pars, indexes, and GPS coordinates
      const newHoles = Array.from({ length: numHoles }, (_, i) => {
        const holeNum = i + 1;
        // Find GPS: poi=1 = Green (middle), poi=11 = Front tee, poi=12 = Back tee
        const greenCoord = coords.find((c) => c.hole === holeNum && c.poi === 1 && c.location === 2);
        const greenFront = coords.find((c) => c.hole === holeNum && c.poi === 1 && c.location === 1);
        const greenAny = greenCoord || greenFront || coords.find((c) => c.hole === holeNum && c.poi === 1);
        const backTee = coords.find((c) => c.hole === holeNum && c.poi === 12);
        const frontTee = coords.find((c) => c.hole === holeNum && c.poi === 11);
        const teeCoord = backTee || frontTee;

        // Use first tee's distance as default
        const firstTee = courseData.tees?.[0];
        const dist = firstTee ? (firstTee as any)[`length${holeNum}`] || 300 : 300;

        // Collect fairway waypoints: dogleg (poi=9), distance markers (poi=6,7,8)
        const waypointCoords = coords
          .filter((c) => c.hole === holeNum && [6, 7, 8, 9].includes(c.poi))
          .map((c) => ({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude), poi: c.poi }));
        // Sort by distance from tee (closest first)
        const teePt = teeCoord ? { lat: parseFloat(teeCoord.latitude), lng: parseFloat(teeCoord.longitude) } : null;
        if (teePt && waypointCoords.length > 1) {
          waypointCoords.sort((a, b) => {
            const da = (a.lat - teePt.lat) ** 2 + (a.lng - teePt.lng) ** 2;
            const db = (b.lat - teePt.lat) ** 2 + (b.lng - teePt.lng) ** 2;
            return da - db;
          });
        }
        const waypoints = waypointCoords.length > 0
          ? waypointCoords.map((w) => ({ lat: w.lat, lng: w.lng }))
          : null;

        return {
          number: holeNum,
          par: courseData.parsMen?.[i] ?? 4,
          distance: dist,
          latitude: greenAny ? parseFloat(greenAny.latitude) : null,
          longitude: greenAny ? parseFloat(greenAny.longitude) : null,
          teeLat: teeCoord ? parseFloat(teeCoord.latitude) : null,
          teeLng: teeCoord ? parseFloat(teeCoord.longitude) : null,
          greenPoints: null as { lat: number; lng: number }[] | null,
          waypoints,
          indexMen: courseData.indexesMen?.[i] ?? null,
          indexWomen: courseData.indexesWomen?.[i] ?? null,
          parWomen: courseData.parsWomen?.[i] ?? null,
        };
      });
      setCourseHoles(newHoles);

      // Build tees
      if (courseData.tees && courseData.tees.length > 0) {
        const tees = courseData.tees.map((t) => {
          const lengths = Array.from({ length: numHoles }, (_, i) => Number((t as any)[`length${i + 1}`]) || 0);
          return {
            name: t.teeName,
            color: t.teeColor || "#999999",
            lengths,
            crMen: t.courseRatingMen && t.courseRatingMen !== "" ? Number(t.courseRatingMen) : null,
            sMen: t.slopeMen && t.slopeMen !== "" ? Number(t.slopeMen) : null,
            crWomen: t.courseRatingWomen && t.courseRatingWomen !== "" ? Number(t.courseRatingWomen) : null,
            sWomen: t.slopeWomen && t.slopeWomen !== "" ? Number(t.slopeWomen) : null,
            golfApiTeeId: t.teeID,
          };
        });
        setCourseTees(tees);
      }

      // Auto-detect zones via OSM (same as manual address selection)
      const lat = parseFloat(courseData.latitude);
      const lng = parseFloat(courseData.longitude);
      if (lat && lng) {
        fetch(`${API}/courses/detect-zones-by-coords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng, radius: 600 }),
        })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.zones) setCourseZones(data.zones.map((z: any) => ({ type: z.type, points: z.points })));
          })
          .catch(() => {});
      }

      // Fill address field with club address
      const fullAddress = [courseData.address, courseData.postalCode, courseData.city, courseData.country].filter(Boolean).join(", ");
      setAddress(fullAddress);
      setGeoSelected(true);
      setApiImported(true);
      setApiResults([]);
      setApiSearch("");
    } catch (e) {
      console.error("Golf API import error:", e);
      setError("Erreur lors de l'import depuis Golf API");
    } finally {
      setApiLoading(false);
    }
  };

  const [address, setAddress] = useState("");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSelected, setGeoSelected] = useState(isEdit);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(course?.imageUrl ?? null);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 3) { setGeoResults([]); return; }
    setGeoLoading(true);
    try {
      const res = await fetch(`${API}/courses/geocode?address=${encodeURIComponent(query)}`);
      setGeoResults(await res.json());
    } catch { setError("Erreur de geocodage"); }
    finally { setGeoLoading(false); }
  }, []);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setGeoSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 400);
  };

  const selectGeoResult = (r: GeoResult) => {
    setForm((f) => ({ ...f, latitude: r.latitude, longitude: r.longitude, city: r.city || f.city, country: r.country || f.country }));
    setAddress(r.displayName);
    setGeoResults([]);
    setGeoSelected(true);
    // Auto-fetch golf boundary + zones from OSM
    if (!isEdit) {
      fetch(`${API}/courses/detect-zones-by-coords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: r.latitude, longitude: r.longitude, radius: 600 }),
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.zones) setCourseZones(data.zones.map((z: any) => ({ type: z.type, points: z.points })));
        })
        .catch(() => {});
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API}/courses/upload-image`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { imageUrl } = await res.json();
      setForm((f) => ({ ...f, imageUrl }));
    } catch { setError("Erreur lors de l'upload"); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const doSave = async () => {
    if (!geoSelected && !isEdit) { setError("Veuillez rechercher et selectionner une adresse"); return; }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `${API}/courses/${course.id}` : `${API}/courses`;
      const method = isEdit ? "PUT" : "POST";
      const totalPar = courseHoles.reduce((sum, h) => sum + h.par, 0);
      const body = {
        ...form, latitude: Number(form.latitude), longitude: Number(form.longitude),
        holes: Number(form.holes), par: totalPar, rating: form.rating ? Number(form.rating) : null,
        imageUrl: form.imageUrl || null,
        courseHoles: courseHoles.map((h: any) => ({
          number: h.number, par: h.par, distance: h.distance,
          ...(h.latitude != null && h.longitude != null ? { latitude: h.latitude, longitude: h.longitude } : {}),
          ...(h.teeLat != null && h.teeLng != null ? { teeLat: h.teeLat, teeLng: h.teeLng } : {}),
          ...(h.greenPoints ? { greenPoints: h.greenPoints } : {}),
          ...(h.waypoints ? { waypoints: h.waypoints } : {}),
          ...(h.indexMen != null ? { indexMen: h.indexMen } : {}),
          ...(h.indexWomen != null ? { indexWomen: h.indexWomen } : {}),
          ...(h.parWomen != null ? { parWomen: h.parWomen } : {}),
        })),
        ...(courseTees.length > 0 ? { courseTees } : {}),
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      const savedCourse = await res.json();
      const courseId = savedCourse.id || course?.id;

      // Save zones: delete old ones, create new ones
      if (courseId) {
        // Delete existing zones
        if (isEdit) {
          const existingZones = await (await fetch(`${API}/courses/${courseId}/zones`)).json();
          for (const z of existingZones) {
            await fetch(`${API}/courses/${courseId}/zones/${z.id}`, { method: "DELETE" });
          }
        }
        // Create new zones
        for (const z of courseZones) {
          await fetch(`${API}/courses/${courseId}/zones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: z.type, points: z.points }),
          });
        }
      }

      onSaved();
      onClose();
    } catch { setError("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSave(); };
  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-white/[0.06] rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <h2 className="text-base font-semibold text-white">{isEdit ? "Modifier le golf" : "Ajouter un golf"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          {/* Golf API Import */}
          {!isEdit && !apiImported && (
            <div className="bg-accent/[0.04] border border-accent/10 rounded-xl p-4">
              <label className="block text-[12px] text-accent font-semibold mb-2">Importer depuis Golf API</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-accent/50" />
                <input
                  value={apiSearch}
                  onChange={(e) => handleApiSearchChange(e.target.value)}
                  className="w-full bg-white/[0.03] border border-accent/20 rounded-lg pl-9 pr-8 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/40"
                  placeholder="Rechercher un golf (ex: Cely, Pebble Beach...)"
                />
                {apiLoading && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" />}
              </div>
              {apiResults.length > 0 && (
                <div className="mt-2 bg-surface border border-white/[0.06] rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                  {apiResults.map((club) => (
                    <div key={club.clubID} className="border-b border-white/[0.03] last:border-0">
                      <div className="px-3 py-2">
                        <p className="text-[13px] text-white font-medium">{club.clubName}</p>
                        <p className="text-[11px] text-gray-500">{club.city}, {club.country}</p>
                      </div>
                      {club.courses.map((c) => (
                        <button
                          key={c.courseID}
                          type="button"
                          onClick={() => importFromGolfApi(club.clubID, c.courseID)}
                          disabled={apiLoading}
                          className="w-full text-left px-3 py-2 pl-6 text-[12px] text-gray-300 hover:bg-accent/[0.06] transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-accent/60" />
                            {c.courseName} — {c.numHoles} trous
                          </span>
                          {c.hasGPS === 1 && <span className="text-[10px] text-accent/60 bg-accent/10 px-1.5 py-0.5 rounded">GPS</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-600 mt-2">Ou remplissez manuellement ci-dessous</p>
            </div>
          )}
          {apiImported && (
            <div className="flex items-center gap-2 bg-accent/[0.06] border border-accent/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-[12px] text-accent font-medium">Importe depuis Golf API — {courseTees.length} departs, {courseHoles.filter((h) => h.latitude != null).length} trous GPS</span>
            </div>
          )}

          {/* Image upload */}
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1.5">Image du golf</label>
            <div className="flex items-start gap-3">
              <div className="relative w-24 h-24 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (<ImageIcon className="w-6 h-6 text-gray-700" />)}
                {uploading && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>)}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-[12px] font-medium text-gray-400 hover:bg-white/[0.03] transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {imagePreview ? "Changer l'image" : "Uploader une image"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-gray-600 mt-1.5">JPG, PNG. Max 5 Mo.</p>
                {form.imageUrl && !uploading && (<p className="text-[11px] text-accent mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Image uploadee</p>)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1">Nom du golf *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30" placeholder="Golf de Saint-Cloud" />
          </div>

          {/* Address */}
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1">Adresse du golf *</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={address} onChange={(e) => handleAddressChange(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-8 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30" placeholder="Tapez une adresse..." />
              {geoLoading && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" />}
            </div>
            {geoResults.length > 0 && (
              <div className="mt-1.5 bg-surface-light border border-white/[0.06] rounded-lg overflow-hidden">
                {geoResults.map((r, i) => (
                  <button key={i} type="button" onClick={() => selectGeoResult(r)} className="w-full text-left px-3 py-2.5 text-[12px] text-gray-300 hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" /><span>{r.displayName}</span>
                  </button>
                ))}
              </div>
            )}
            {geoSelected && form.latitude !== 0 && (
              <p className="text-[11px] text-accent mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{form.city}, {form.country} — {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-gray-500 font-medium mb-1">Ville</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30" placeholder="Rempli automatiquement" />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 font-medium mb-1">Pays</label>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30" placeholder="Rempli automatiquement" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] text-gray-500 font-medium mb-1">Nb trous</label>
              <input type="number" min={1} max={36} value={form.holes} onChange={(e) => updateHolesCount(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:outline-none focus:border-accent/30" />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 font-medium mb-1">Par total</label>
              <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[13px] text-accent font-medium">{courseHoles.reduce((sum, h) => sum + h.par, 0)}</div>
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 font-medium mb-1">Rating</label>
              <input type="number" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:outline-none focus:border-accent/30" />
            </div>
          </div>

          {/* Holes + Map */}
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-2">Details des trous &amp; positions GPS</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[32px_1fr_1fr_28px_28px] gap-1 px-3 py-2 border-b border-white/[0.04]">
                  <span className="text-[10px] text-gray-600 font-medium uppercase">N°</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase">Par</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase">Dist.</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase text-center" title="Drapeau">🏁</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase text-center" title="Tee">T</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto overscroll-contain relative z-10">
                  {courseHoles.map((hole, i) => (
                    <div key={i} className={`grid grid-cols-[32px_1fr_1fr_28px_28px] gap-1 px-3 py-1 border-b border-white/[0.02] last:border-0 items-center transition-colors ${activeHoleIndex === i ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}>
                      <span className={`text-[12px] font-bold text-center ${activeHoleIndex === i ? "text-accent" : "text-gray-400"}`}>{hole.number}</span>
                      <select value={hole.par} onChange={(e) => updateHole(i, "par", Number(e.target.value))} className="bg-white/[0.03] border border-white/[0.06] rounded-md px-1.5 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-accent/30">
                        {[3, 4, 5].map((p) => (<option key={p} value={p} className="bg-surface text-gray-200">{p}</option>))}
                      </select>
                      <input type="number" min={50} max={700} value={hole.distance} onChange={(e) => updateHole(i, "distance", Number(e.target.value))} className="bg-white/[0.03] border border-white/[0.06] rounded-md px-1.5 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-accent/30 w-full" />
                      <button
                        type="button"
                        onClick={() => { setActiveHoleIndex(i); setHoleTool("green"); }}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                          activeHoleIndex === i && holeTool === "green"
                            ? "bg-accent/20 border border-accent/50"
                            : hole.latitude != null
                              ? "bg-accent/10 border border-transparent"
                              : "border border-white/[0.06]"
                        }`}
                        title="Placer le drapeau"
                      >
                        {hole.latitude != null
                          ? <CheckCircle2 className={`w-3.5 h-3.5 ${activeHoleIndex === i && holeTool === "green" ? "text-accent" : "text-accent/60"}`} />
                          : <div className={`w-2.5 h-2.5 rounded-full ${activeHoleIndex === i && holeTool === "green" ? "bg-accent" : "border border-gray-600"}`} />
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveHoleIndex(i); setHoleTool("tee"); }}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                          activeHoleIndex === i && holeTool === "tee"
                            ? "bg-blue-500/20 border border-blue-500/50"
                            : hole.teeLat != null
                              ? "bg-blue-500/10 border border-transparent"
                              : "border border-white/[0.06]"
                        }`}
                        title="Placer le tee"
                      >
                        {hole.teeLat != null
                          ? <CheckCircle2 className={`w-3.5 h-3.5 ${activeHoleIndex === i && holeTool === "tee" ? "text-blue-400" : "text-blue-400/60"}`} />
                          : <div className={`w-2.5 h-2.5 rounded-full ${activeHoleIndex === i && holeTool === "tee" ? "bg-blue-400" : "border border-gray-600"}`} />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] text-gray-500">
                    Cliquez pour placer {holeTool === "tee" ? <span className="text-blue-400 font-semibold">le tee du trou {activeHoleIndex + 1}</span> : <span className="text-accent font-semibold">le drapeau du trou {activeHoleIndex + 1}</span>}
                  </p>
                  <p className="text-[10px] text-gray-600">{courseHoles.filter((h) => h.latitude != null).length}/{courseHoles.length}</p>
                </div>
                {form.latitude !== 0 && form.longitude !== 0 ? (
                  <HoleMap
                    center={[form.latitude, form.longitude]}
                    holes={courseHoles.map((h) => ({ number: h.number, latitude: h.latitude, longitude: h.longitude, teeLat: h.teeLat, teeLng: h.teeLng, greenPoints: h.greenPoints, waypoints: h.waypoints }))}
                    activeHole={activeHoleIndex}
                    onHolePositioned={handleHolePositioned}
                    onTeePositioned={handleTeePositioned}
                    onActiveHoleChange={setActiveHoleIndex}
                    holeTool={holeTool}
                    onHoleToolChange={setHoleTool}
                    onSave={doSave}
                    saving={saving}
                    zones={courseZones}
                    onZonesChange={setCourseZones}
                    courseId={isEdit ? course.id : undefined}
                    courseTees={courseTees}
                    onHolesDetected={(detectedHoles) => {
                      setCourseHoles((prev) => {
                        const updated = [...prev];
                        for (const dh of detectedHoles) {
                          const idx = dh.number - 1;
                          if (idx >= 0 && idx < updated.length) {
                            updated[idx] = {
                              ...updated[idx],
                              latitude: dh.latitude,
                              longitude: dh.longitude,
                              teeLat: (dh as any).teeLat || updated[idx].teeLat,
                              teeLng: (dh as any).teeLng || updated[idx].teeLng,
                              par: dh.par || updated[idx].par,
                              greenPoints: dh.greenPoints || updated[idx].greenPoints,
                            };
                          }
                        }
                        return recalcDistances(updated);
                      });
                    }}
                  />
                ) : (
                  <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center" style={{ height: 350 }}>
                    <p className="text-[13px] text-gray-600 text-center px-4">Recherchez une adresse pour afficher la carte</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tees / Departs */}
          {courseTees.length > 0 && (
            <div>
              <label className="block text-[12px] text-gray-500 font-medium mb-2">Departs importes ({courseTees.length})</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {courseTees.map((t, i) => (
                  <div key={i} className="flex flex-col items-center min-w-[80px] px-3 py-2 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                    <div className="w-4 h-4 rounded-full mb-1.5 border border-black/20" style={{ backgroundColor: t.color }} />
                    <span className="text-[12px] font-semibold text-white">{t.name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {t.crMen != null ? `CR ${t.crMen}` : "—"} / {t.sMen != null ? `S ${t.sMen}` : "—"}
                    </span>
                    <span className="text-[10px] text-gray-600 mt-0.5">{t.lengths.reduce((a, b) => a + b, 0)}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/[0.06] text-[13px] font-medium text-gray-400 hover:bg-white/[0.03] transition-colors">Annuler</button>
            <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-dark text-[13px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isEdit ? "Mettre a jour" : "Creer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Delete Modal ---- */
function DeleteModal({ course, onClose, onDeleted }: { course: Course; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try { await fetch(`${API}/courses/${course.id}`, { method: "DELETE" }); onDeleted(); onClose(); } catch { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-white/[0.06] rounded-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-2">Supprimer ce golf ?</h2>
        <p className="text-[13px] text-gray-500 mb-6"><span className="text-gray-300 font-medium">{course.name}</span> sera supprime definitivement.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/[0.06] text-[13px] font-medium text-gray-400 hover:bg-white/[0.03] transition-colors">Annuler</button>
          <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/20 text-[13px] font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Golfs Page ---- */
export default function GolfsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalCourse, setModalCourse] = useState<Course | null | "new">(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try { setCourses(await (await fetch(`${API}/courses`)).json()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const openEditModal = async (c: Course) => {
    try { setModalCourse(await (await fetch(`${API}/courses/${c.id}`)).json()); }
    catch { setModalCourse(c); }
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Golfs</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{courses.length} parcours enregistres</p>
        </div>
        <button onClick={() => setModalCourse("new")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-dark text-[13px] font-semibold hover:bg-accent-dark transition-colors btn-glow">
          <Plus className="w-4 h-4" /> Ajouter un golf
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input type="text" placeholder="Rechercher un golf..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors" />
      </div>

      <div className="card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-[14px] text-gray-500">Aucun golf trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Ville</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Pays</th>
                  <th className="text-center px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Trous</th>
                  <th className="text-center px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Par</th>
                  <th className="text-center px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Rating</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-gray-200">{c.name}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-400">{c.city}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-400">{c.country}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-400 text-center">{c.holes}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-400 text-center">{c.par}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-400 text-center">{c.rating ?? "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEditModal(c)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.04] text-gray-600 hover:text-accent transition-colors" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteCourse(c)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalCourse !== null && <CourseModal course={modalCourse === "new" ? null : modalCourse} onClose={() => setModalCourse(null)} onSaved={fetchCourses} />}
      {deleteCourse && <DeleteModal course={deleteCourse} onClose={() => setDeleteCourse(null)} onDeleted={fetchCourses} />}
    </>
  );
}
