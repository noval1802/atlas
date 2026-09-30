import type { LucideIcon } from "lucide-react";
export function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-cyan-400" />
        <h2 className="text-xs font-semibold tracking-[.14em] text-slate-200">{title}</h2>
      </div>
      {action}
    </div>
  );
}
