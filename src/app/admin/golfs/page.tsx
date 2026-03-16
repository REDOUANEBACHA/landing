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

/* ---- Types ---- */
interface CourseHole {
  id: string;
  number: number;
  par: number;
  distance: number;
  latitude?: number | null;
  longitude?: number | null;
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
}

interface GeoResult {
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
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
      return course.courseHoles.map((h) => ({
        number: h.number, par: h.par, distance: h.distance,
        latitude: h.latitude ?? null, longitude: h.longitude ?? null,
      }));
    }
    return Array.from({ length: initialHolesCount }, (_, i) => ({
      number: i + 1, par: 4, distance: 300, latitude: null as number | null, longitude: null as number | null,
    }));
  };
  const [courseHoles, setCourseHoles] = useState(buildInitialHoles);
  const [activeHoleIndex, setActiveHoleIndex] = useState(0);

  const updateHolesCount = (count: number) => {
    const n = Math.max(1, Math.min(36, count));
    setForm((f) => ({ ...f, holes: n }));
    setCourseHoles((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({
          number: prev.length + i + 1, par: 4, distance: 300, latitude: null as number | null, longitude: null as number | null,
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
        courseHoles: courseHoles.map((h) => ({
          number: h.number, par: h.par, distance: h.distance,
          ...(h.latitude != null && h.longitude != null ? { latitude: h.latitude, longitude: h.longitude } : {}),
        })),
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
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
                <div className="grid grid-cols-[40px_1fr_1fr_20px] gap-1.5 px-3 py-2 border-b border-white/[0.04]">
                  <span className="text-[10px] text-gray-600 font-medium uppercase">N°</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase">Par</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase">Dist.</span>
                  <span className="text-[10px] text-gray-600 font-medium uppercase">GPS</span>
                </div>
                <div className="max-h-[310px] overflow-y-auto">
                  {courseHoles.map((hole, i) => (
                    <button type="button" key={i} onClick={() => setActiveHoleIndex(i)} className={`w-full grid grid-cols-[40px_1fr_1fr_20px] gap-1.5 px-3 py-1.5 border-b border-white/[0.02] last:border-0 items-center transition-colors ${activeHoleIndex === i ? "bg-accent/10" : "hover:bg-white/[0.02]"}`}>
                      <span className={`text-[12px] font-bold text-center ${activeHoleIndex === i ? "text-accent" : "text-gray-400"}`}>{hole.number}</span>
                      <select value={hole.par} onClick={(e) => e.stopPropagation()} onChange={(e) => updateHole(i, "par", Number(e.target.value))} className="bg-white/[0.03] border border-white/[0.06] rounded-md px-1.5 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-accent/30">
                        {[3, 4, 5].map((p) => (<option key={p} value={p} className="bg-surface text-gray-200">{p}</option>))}
                      </select>
                      <input type="number" min={50} max={700} value={hole.distance} onClick={(e) => e.stopPropagation()} onChange={(e) => updateHole(i, "distance", Number(e.target.value))} className="bg-white/[0.03] border border-white/[0.06] rounded-md px-1.5 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-accent/30 w-full" />
                      <div className="flex justify-center">
                        {hole.latitude != null ? <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> : <div className="w-3 h-3 rounded-full border border-gray-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] text-gray-500">Cliquez pour placer le <span className="text-accent font-semibold">trou {activeHoleIndex + 1}</span></p>
                  <p className="text-[10px] text-gray-600">{courseHoles.filter((h) => h.latitude != null).length}/{courseHoles.length} places</p>
                </div>
                {form.latitude !== 0 && form.longitude !== 0 ? (
                  <HoleMap center={[form.latitude, form.longitude]} holes={courseHoles.map((h) => ({ number: h.number, latitude: h.latitude, longitude: h.longitude }))} activeHole={activeHoleIndex} onHolePositioned={handleHolePositioned} onSave={doSave} saving={saving} />
                ) : (
                  <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center" style={{ height: 350 }}>
                    <p className="text-[13px] text-gray-600 text-center px-4">Recherchez une adresse pour afficher la carte</p>
                  </div>
                )}
              </div>
            </div>
          </div>

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
