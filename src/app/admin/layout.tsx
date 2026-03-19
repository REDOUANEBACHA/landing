"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Medal,
  Activity,
  Trophy,
  MapPin,
} from "lucide-react";

const sidebarItems = [
  { icon: <BarChart3 className="w-4.5 h-4.5" />, label: "Dashboard", href: "/admin" },
  { icon: <MapPin className="w-4.5 h-4.5" />, label: "Golfs", href: "/admin/golfs" },
  { icon: <Users className="w-4.5 h-4.5" />, label: "Utilisateurs", href: "/admin/users" },
  { icon: <Bell className="w-4.5 h-4.5" />, label: "Notifications", href: "/admin/notifications" },
  { icon: <Trophy className="w-4.5 h-4.5" />, label: "Concours", href: "/admin/contests" },
  { icon: <Medal className="w-4.5 h-4.5" />, label: "Modules", href: "/admin/modules" },
  { icon: <CreditCard className="w-4.5 h-4.5" />, label: "Abonnements", href: "/admin/subscriptions" },
  { icon: <Activity className="w-4.5 h-4.5" />, label: "Activite", href: "/admin/activity" },
  { icon: <Settings className="w-4.5 h-4.5" />, label: "Parametres", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-56" : "w-16"
        } shrink-0 border-r border-white/[0.04] bg-surface/50 flex flex-col transition-all duration-300 sticky top-0 h-screen`}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.04]">
          <Image src="/logoGolfCool.png" alt="Logo" width={28} height={28} className="rounded-md" />
          {sidebarOpen && <span className="text-sm font-semibold text-white tracking-tight">Cool Golf</span>}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-accent/10 text-accent"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
              }`}
            >
              {item.icon}
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/[0.04] p-2">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-colors">
            <LogOut className="w-4.5 h-4.5" />
            {sidebarOpen && "Deconnexion"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-white/[0.04] flex items-center justify-between px-6 shrink-0 bg-surface/30 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-gray-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-gray-500 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
            </button>
            <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[11px] font-bold">A</div>
              <span className="text-[13px] text-gray-300 font-medium">Admin</span>
              <ChevronDown className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
