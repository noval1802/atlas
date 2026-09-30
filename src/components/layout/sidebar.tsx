"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  Flame,
  LayoutDashboard,
  Map,
  MapPinned,
  Megaphone,
  Menu,
  Mountain,
  PackageOpen,
  KeyRound,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
const menu = [
  { label: "Dashboard Nasional", href: "/dashboard", icon: LayoutDashboard },
  { label: "Peta Situasi", href: "/map", icon: Map },
  { label: "BANGSIT", href: "/bangsit", icon: BarChart3 },
  { label: "Kejadian", href: "/kejadian", icon: Activity },
  { label: "Bencana Alam", href: "/bencana", icon: Mountain },
  { label: "Karhutla", href: "/karhutla", icon: Flame },
  { label: "Unras", href: "/unras", icon: Megaphone },
  { label: "Gangguan Keamanan", href: "/security", icon: ShieldAlert },
  { label: "Personel & Alut", href: "/resources", icon: Users },
  { label: "Early Warning", href: "/alerts", icon: AlertTriangle },
  { label: "Laporan", href: "/reports", icon: PackageOpen },
  { label: "Data Kotamaops", href: "/kodam", icon: MapPinned },
  { label: "Akses Saya", href: "/my-access", icon: KeyRound },
  { label: "Administration", href: "/admin", icon: Settings },
];
export function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const path = usePathname();
  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg border border-slate-700 bg-[#0b1424] p-2 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <aside
        className={cn(
          "atlas-print-hidden fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-[#08111f]/98 transition-all duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen",
          collapsed ? "w-[76px]" : "w-[250px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-[78px] items-center border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 font-bold text-cyan-300">
            A
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0">
              <p className="text-lg font-bold tracking-[.22em]">ATLAS</p>
              <p className="truncate text-[8px] tracking-wide text-slate-500">ADVANCED TACTICAL SYSTEM</p>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-slate-400 lg:hidden">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menu.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-xs transition",
                path === href
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "border border-transparent text-slate-400 hover:bg-white/[.035] hover:text-slate-200",
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {path === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-10 w-full items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white lg:flex"
          >
            <ChevronLeft size={18} className={cn("transition", collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-2 text-xs">Collapse sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
