"use client";

import {
  Users,
  CreditCard,
  TrendingUp,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  ChevronDown,
} from "lucide-react";

const stats = [
  { label: "Utilisateurs", value: "2 847", change: "+12.5%", up: true, icon: <Users className="w-5 h-5" /> },
  { label: "Abonnes Premium", value: "1 203", change: "+8.2%", up: true, icon: <CreditCard className="w-5 h-5" /> },
  { label: "Revenu mensuel", value: "11 918\u20AC", change: "+15.3%", up: true, icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Concours actifs", value: "14", change: "-2", up: false, icon: <Trophy className="w-5 h-5" /> },
];

export default function AdminDashboard() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Vue d&apos;ensemble de Cool Golf Method</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[12px] font-medium text-gray-400 hover:bg-white/[0.03] transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            7 derniers jours
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[12px] font-medium text-gray-400 hover:bg-white/[0.03] transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filtres
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="icon-box w-9 h-9 bg-accent/[0.07] text-accent">{s.icon}</div>
              <div className={`flex items-center gap-0.5 text-[12px] font-medium ${s.up ? "text-accent" : "text-red-400"}`}>
                {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}
