"use client";
import dynamic from "next/dynamic";
const SituationMap = dynamic(() => import("./situation-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[390px] items-center justify-center bg-[#07101f] text-xs text-slate-500">
      Memuat peta situasi...
    </div>
  ),
});
export function MapLoader() {
  return <SituationMap />;
}
