import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
const tones: Record<string, string> = {
  cyan: "bg-cyan-400/10 text-cyan-400",
  blue: "bg-blue-400/10 text-blue-400",
  orange: "bg-orange-400/10 text-orange-400",
  yellow: "bg-yellow-400/10 text-yellow-400",
  red: "bg-rose-400/10 text-rose-400",
  emerald: "bg-emerald-400/10 text-emerald-400",
};
export function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  change: number;
  icon: LucideIcon;
  tone: string;
}) {
  const up = change >= 0;
  return (
    <div className="panel rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-slate-600">
      <div className="flex items-start justify-between">
        <span className={cn("rounded-lg p-2.5", tones[tone])}>
          <Icon size={19} />
        </span>
        <span
          className={cn(
            "flex items-center text-[11px] font-semibold",
            up ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {Math.abs(change)}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-400">{label}</p>
    </div>
  );
}
