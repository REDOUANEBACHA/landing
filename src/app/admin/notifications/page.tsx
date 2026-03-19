"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  Users,
  User,
  Loader2,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL!;
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "golf-admin-secret";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  pushToken: string | null;
  appVersion: string | null;
}

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

export default function NotificationsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await adminFetch("/users");
      const data: AdminUser[] = await res.json();
      setUsers(data);
    } catch {}
    finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const usersWithToken = users.filter((u) => u.pushToken);
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Titre et message requis");
      return;
    }
    setSending(true);
    setError("");
    setResult(null);
    try {
      const payload: { title: string; body: string; userId?: string } = { title, body };
      if (selectedUser) payload.userId = selectedUser.id;
      const res = await adminFetch("/notify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setResult(data);
      setTitle("");
      setBody("");
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Notifications push</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Envoyer des notifications aux utilisateurs de l&apos;app</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="icon-box w-9 h-9 bg-accent/[0.07] text-accent">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loadingUsers ? "—" : usersWithToken.length}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">Utilisateurs avec push token</p>
        </div>
        <div className="card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="icon-box w-9 h-9 bg-accent/[0.07] text-accent">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loadingUsers ? "—" : users.length}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">Utilisateurs total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="card rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-white mb-4">Composer un message</h2>

          {/* Target */}
          <div className="mb-4">
            <label className="block text-[12px] text-gray-500 font-medium mb-1.5">Destinataire</label>
            {selectedUser ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/[0.06] border border-accent/20">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[13px] text-accent font-medium">{selectedUser.name}</span>
                  <span className="text-[12px] text-gray-500">{selectedUser.email}</span>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Users className="w-3.5 h-3.5 text-accent" />
                <span className="text-[13px] text-gray-300">Tous les utilisateurs</span>
                <span className="ml-auto text-[11px] text-gray-600">{usersWithToken.length} tokens</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-3">
            <label className="block text-[12px] text-gray-500 font-medium mb-1.5">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Nouvelle mise à jour ⛳"
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors"
            />
          </div>

          {/* Body */}
          <div className="mb-5">
            <label className="block text-[12px] text-gray-500 font-medium mb-1.5">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="ex: Découvrez les nouvelles fonctionnalités de Cool Golf !"
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {result && (
            <div className="flex items-center gap-2 text-accent text-[13px] bg-accent/[0.06] border border-accent/20 rounded-lg px-3 py-2 mb-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {result.sent} notification{result.sent > 1 ? "s" : ""} envoyée{result.sent > 1 ? "s" : ""}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-dark text-[13px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {selectedUser ? `Envoyer à ${selectedUser.name}` : "Envoyer à tous"}
          </button>
        </div>

        {/* User picker */}
        <div className="card rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-white mb-3">Cibler un utilisateur</h2>
          <p className="text-[12px] text-gray-500 mb-4">Sélectionnez un utilisateur pour envoyer uniquement à lui, ou laissez vide pour envoyer à tous.</p>

          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors"
            />
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[13px] text-gray-600 text-center py-6">Aucun utilisateur trouvé</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedUser?.id === u.id
                      ? "bg-accent/10 border border-accent/20"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[11px] font-bold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-gray-200">{u.name}</p>
                      <p className="text-[11px] text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.appVersion && (
                      <span className="text-[10px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        v{u.appVersion}
                      </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${u.pushToken ? "bg-accent" : "bg-gray-700"}`} title={u.pushToken ? "Push activé" : "Pas de push token"} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
