"use client";
import { Bell, LogOut, Search, Wifi } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
function formatClock(date: Date) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
      hour12: false,
    })
      .format(date)
      .replace("pukul", "|") + " WIB"
  );
}
export function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const { data } = useSession();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const name = data?.user?.name ?? "Pengguna ATLAS";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="atlas-print-hidden sticky top-0 z-20 flex min-h-[78px] items-center justify-between border-b border-slate-800 bg-[#060b16]/90 px-4 pl-16 backdrop-blur-xl lg:px-6">
      <div>
        <h1 className="text-sm font-semibold sm:text-base">ATLAS Command Center</h1>
        <p className="mt-1 hidden text-[10px] tracking-wide text-slate-500 sm:block">
          Advanced Tactical Location & Analytics System
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden text-right xl:block">
          <p className="text-[11px] text-slate-300">{now ? formatClock(now) : "Memuat waktu sistem..."}</p>
          <p className="mt-1 flex items-center justify-end gap-1.5 text-[9px] font-bold tracking-[.16em] text-emerald-400">
            <Wifi size={11} /> SYSTEM ONLINE
          </p>
        </div>
        <button className="hidden rounded-lg border border-slate-800 p-2.5 text-slate-400 hover:text-white sm:block">
          <Search size={17} />
        </button>
        <button className="relative rounded-lg border border-slate-800 p-2.5 text-slate-400 hover:text-white">
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 p-1.5 pr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-blue-700 text-xs font-bold">
            {initials}
          </span>
          <span className="hidden text-left md:block">
            <span className="block max-w-32 truncate text-[11px] font-medium">{name}</span>
            <span className="block text-[9px] text-slate-500">
              {data?.user?.role?.replaceAll("_", " ") ?? "Memuat..."}
            </span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Keluar"
            aria-label="Keluar"
            className="ml-1 text-slate-500 hover:text-rose-400"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
