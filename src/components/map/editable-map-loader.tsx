"use client";
import dynamic from "next/dynamic";
const Map = dynamic(() => import("./editable-situation-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-220px)] min-h-[520px] items-center justify-center bg-[#07101f] text-xs text-slate-500">
      Memuat editor peta...
    </div>
  ),
});
export function EditableMapLoader() {
  return <Map />;
}
