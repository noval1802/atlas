"use client";

import { useCallback, useEffect, useState } from "react";
import { syncIncidentAnnotations } from "@/lib/map-annotation-storage";
import type { Incident } from "@/types";

type ApiIncident = Omit<Incident, "kodam" | "time" | "eventDate"> & {
  incidentTime: string;
  incidentDate: string;
  kodamId: string;
  kodam: { name: string };
};
type KodamOption = { id: string; name: string; latitude: number; longitude: number };
type IncidentInput = Omit<Incident, "id" | "time" | "kodamId">;

function fromApi(item: ApiIncident): Incident {
  return {
    id: item.id,
    kodamId: item.kodamId,
    time: item.incidentTime,
    eventDate: item.incidentDate,
    kodam: item.kodam.name,
    location: item.location,
    category: item.category,
    description: item.description,
    status: item.status,
    personnel: item.personnel,
    latitude: item.latitude,
    longitude: item.longitude,
    source: item.source,
  };
}

export function useIncidentsApi() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [kodams, setKodams] = useState<KodamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const publish = useCallback((next: Incident[]) => {
    setRows(next);
    syncIncidentAnnotations(next);
    window.dispatchEvent(new CustomEvent("atlas:incidents-updated"));
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/incidents"), fetch("/api/kodams")])
      .then(async ([incidentResponse, kodamResponse]) => {
        const incidentData = await incidentResponse.json();
        const kodamData = await kodamResponse.json();
        if (!incidentResponse.ok) throw new Error(incidentData.error ?? "Kejadian gagal dimuat");
        if (!kodamResponse.ok) throw new Error(kodamData.error ?? "Data Kodam gagal dimuat");
        if (active) {
          publish((incidentData as ApiIncident[]).map(fromApi));
          setKodams(
            (
              kodamData as Array<{
                id: string;
                slug: string | null;
                name: string;
                latitude: number;
                longitude: number;
              }>
            ).map((item) => ({
              id: item.id,
              name: item.name,
              latitude: item.latitude,
              longitude: item.longitude,
            })),
          );
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Kejadian gagal dimuat");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [publish]);
  const request = useCallback(async (url: string, method: "POST" | "PUT" | "DELETE", body?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Operasi kejadian gagal");
    return data;
  }, []);
  const save = useCallback(
    async (input: IncidentInput, existing?: Incident) => {
      setError("");
      const selectedKodam = kodams.find((item) => item.name === input.kodam);
      const kodamId = selectedKodam?.id ?? existing?.kodamId;
      if (!kodamId) throw new Error("Kodam tidak ditemukan");
      const now = new Date();
      const payload = {
        kodamId,
        category: input.category,
        title: `${input.category} - ${input.location}`,
        description: input.description,
        location: input.location,
        latitude: selectedKodam?.latitude ?? input.latitude,
        longitude: selectedKodam?.longitude ?? input.longitude,
        incidentDate: now.toISOString(),
        incidentTime:
          existing?.time ??
          now
            .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
            .replace(".", ":"),
        status: input.status,
        personnel: input.personnel,
        crowdEstimate: 0,
        source: "ATLAS_UI",
      };
      const data = (await request(
        existing ? `/api/incidents/${existing.id}` : "/api/incidents",
        existing ? "PUT" : "POST",
        payload,
      )) as ApiIncident;
      const saved = fromApi({ ...data, kodam: { name: input.kodam } });
      publish(existing ? rows.map((item) => (item.id === existing.id ? saved : item)) : [saved, ...rows]);
      return saved;
    },
    [kodams, publish, request, rows],
  );
  const remove = useCallback(
    async (incident: Incident) => {
      setError("");
      await request(`/api/incidents/${incident.id}`, "DELETE");
      publish(rows.filter((item) => item.id !== incident.id));
    },
    [publish, request, rows],
  );
  return { rows, kodams, loading, error, setError, save, remove };
}
