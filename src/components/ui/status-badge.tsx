import type { Status } from "@/types";
import { cn } from "@/lib/utils";
const styles = {
  KONDUSIF: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  WASPADA: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  SIAGA: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[.12em]",
        styles[status],
        className,
      )}
    >
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
