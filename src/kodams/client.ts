import { kodams, type KodamData } from "@/data/kodam";

type ApiKodam = {
  id: string;
  slug: string | null;
  code: string;
  name: string;
  region: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: KodamData["status"];
  personnel: number;
  incidentCount: number;
  deployed: number;
  logoFilename: string | null;
  logoUpdatedAt: string | null;
};

export function mapApiKodam(item: ApiKodam): KodamData {
  const base = kodams.find((kodam) => kodam.id === item.slug || kodam.code === item.code);
  const logoId = item.slug ?? item.id;
  const uploadedLogo = item.logoFilename
    ? `/api/kodams/${encodeURIComponent(logoId)}/logo?v=${encodeURIComponent(item.logoUpdatedAt ?? "1")}`
    : null;
  return {
    id: item.slug ?? base?.id ?? item.id,
    code: item.code,
    name: item.name,
    region: item.region,
    location: item.location || base?.location || "",
    latitude: item.latitude ?? base?.latitude ?? 0,
    longitude: item.longitude ?? base?.longitude ?? 0,
    status: item.status,
    incidents: item.incidentCount,
    personnel: item.personnel,
    deployed: item.deployed,
    logo: uploadedLogo ?? base?.logo ?? "/kodam/default-kotamaops.svg",
  };
}

export async function fetchKodams(): Promise<KodamData[]> {
  const response = await fetch("/api/kodams", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Data Kodam gagal dimuat");
  return (data as ApiKodam[]).map(mapApiKodam);
}

export function notifyKodamsUpdated() {
  window.dispatchEvent(new CustomEvent("atlas:kodams-updated"));
}
