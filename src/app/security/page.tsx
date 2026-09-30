"use client";
import { LockKeyhole, MapPin, ShieldAlert, Users } from "lucide-react";
import { OperationalPage } from "@/components/modules/operational-page";
const config = {
  module: "security",
  eyebrow: "SECURITY MONITORING",
  title: "Gangguan Keamanan",
  description: "Pemantauan ancaman dan respons keamanan wilayah",
  stats: [
    { label: "Kejadian Aktif", value: "5", icon: ShieldAlert },
    { label: "Wilayah Pantauan", value: "9", icon: MapPin },
    { label: "Personel", value: "740", icon: Users },
    { label: "Objek Vital", value: "128", icon: LockKeyhole },
  ],
  rows: [
    ["Jakarta", "Patroli objek vital", "120 personel", "KONDUSIF"],
    ["Papua", "Pengamanan wilayah", "280 personel", "WASPADA"],
    ["Maluku", "Patroli terpadu", "140 personel", "KONDUSIF"],
    ["Sulawesi Tengah", "Monitoring area", "200 personel", "WASPADA"],
  ],
};
export default function Page() {
  return <OperationalPage config={config} />;
}
