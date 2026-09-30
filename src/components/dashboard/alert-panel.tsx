import { AlertTriangle, BellRing, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AlertItem } from "@/types";
const config = {
  CRITICAL: { icon: BellRing, color: "text-rose-400", border: "border-l-rose-500" },
  WARNING: { icon: AlertTriangle, color: "text-amber-400", border: "border-l-amber-500" },
  INFO: { icon: Info, color: "text-cyan-400", border: "border-l-cyan-500" },
};
export function AlertPanel({ data }: { data: AlertItem[] }) {
  return (
    <div className="space-y-3 p-3">
      {data.map((a) => {
        const c = config[a.level],
          Icon = c.icon;
        return (
          <article
            key={a.id}
            className={cn("rounded-lg border border-slate-800 border-l-2 bg-slate-950/30 p-3", c.border)}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn("flex items-center gap-1.5 text-[9px] font-bold tracking-[.14em]", c.color)}
              >
                <Icon size={13} />
                {a.level}
              </span>
              <span className="text-[9px] text-slate-600">{a.time}</span>
            </div>
            <p className="mt-3 text-xs font-semibold">{a.title}</p>
            <p className="mt-1 text-[10px] text-cyan-400">{a.kodam}</p>
            <p className="mt-2 text-[10px] text-slate-400">{a.detail}</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-mono text-sm font-semibold">{a.metric}</span>
              <StatusBadge status={a.status} />
            </div>
          </article>
        );
      })}
      {data.length === 0 && (
        <p className="p-6 text-center text-xs text-slate-500">Belum ada early warning aktif.</p>
      )}
    </div>
  );
}
