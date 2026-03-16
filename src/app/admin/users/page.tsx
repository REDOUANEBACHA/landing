"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL!;

interface User {
  id: string;
  name: string;
  email: string;
  handicap: number;
  avatarUrl: string | null;
  createdAt: string;
}

/* ---- User Edit Modal ---- */
function UserEditModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [handicap, setHandicap] = useState(user.handicap);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, handicap: Number(handicap) }),
      });
      if (!res.ok) throw new Error();
      onSaved();
      onClose();
    } catch { setError("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-white/[0.06] rounded-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <h2 className="text-base font-semibold text-white">Modifier l&apos;utilisateur</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1">Email</label>
            <p className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[13px] text-gray-500">{user.email}</p>
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1">Nom *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:outline-none focus:border-accent/30" />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1">Handicap</label>
            <input type="number" step="0.1" min="0" max="54" value={handicap} onChange={(e) => setHandicap(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:outline-none focus:border-accent/30" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/[0.06] text-[13px] font-medium text-gray-400 hover:bg-white/[0.03] transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-dark text-[13px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- User Delete Modal ---- */
function UserDeleteModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try { await fetch(`${API}/users/${user.id}`, { method: "DELETE" }); onDeleted(); onClose(); } catch { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-white/[0.06] rounded-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-2">Supprimer cet utilisateur ?</h2>
        <p className="text-[13px] text-gray-500 mb-1"><span className="text-gray-300 font-medium">{user.name}</span> ({user.email})</p>
        <p className="text-[12px] text-gray-600 mb-6">Toutes ses parties, videos et donnees seront supprimees definitivement.</p>
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

/* ---- Users Page ---- */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await (await fetch(`${API}/users`)).json()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Utilisateurs</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{users.length} utilisateurs enregistres</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input type="text" placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors" />
      </div>

      <div className="card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="text-center px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Handicap</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-600 uppercase tracking-wider">Inscription</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
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
                    <td className="px-5 py-3 text-[12px] text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditUser(u)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.04] text-gray-600 hover:text-accent transition-colors" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteUser(u)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUser && <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
      {deleteUser && <UserDeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={fetchUsers} />}
    </>
  );
}
