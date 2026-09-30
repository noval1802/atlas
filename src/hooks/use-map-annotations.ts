"use client";
import { useEffect, useState } from "react";
import type { Incident, Status } from "@/types";
import type { MapAnnotation } from "@/types/map-annotation";
import {
  annotationEvent,
  loadMapAnnotations,
  syncBangsitAnnotations,
  syncIncidentAnnotations,
  syncAnnotationLayoutsFromServer,
  syncOperationalAnnotations,
} from "@/lib/map-annotation-storage";
import { parseRealtimeInvalidation, realtimeBrowserEvent, realtimeWebSocketUrl } from "@/lib/realtime-events";

type ApiIncident = {
  id: string;
  incidentTime: string;
  incidentDate: string;
  kodamId: string;
  kodam: { name: string };
  location: string;
  category: string;
  description: string;
  status: Status;
  personnel: number;
  latitude: number;
  longitude: number;
  source: string | null;
};

type ApiMonitoringRecord = {
  id: string;
  primary: string;
  secondary: string;
  detail: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  crowdEstimate: number | null;
  personnel: number | null;
  createdBy: string | null;
  createdAt: string;
};

type ApiBangsitArchive = {
  id: string;
  reportId: string;
  createdAt: string;
  kodam: { name: string };
  payload: {
    date?: string;
    time?: string;
    eventType?: string;
    location?: string;
    latitude?: string | number;
    longitude?: string | number;
    crowd?: string | number;
    personnel?: string | number;
    alut?: string;
    chronology?: string;
    status?: string;
  };
};

const monitoringSources = [
  ["bencana", "Bencana Alam"],
  ["karhutla", "Kebakaran Hutan & Lahan"],
  ["unras", "Unjuk Rasa"],
] as const;

function monitoringRow(record: ApiMonitoringRecord): string[] {
  return [
    record.primary,
    record.secondary,
    record.detail,
    record.status,
    record.latitude?.toString() ?? "",
    record.longitude?.toString() ?? "",
    record.id,
    record.createdBy ?? "",
    record.createdAt,
    record.crowdEstimate?.toString() ?? "",
    record.personnel?.toString() ?? "",
  ];
}

async function reconcileWithServer() {
  const requests = [
    fetch("/api/incidents"),
    ...monitoringSources.map(([module]) => fetch(`/api/monitoring/${module}`)),
    fetch("/api/bangsit"),
  ];
  const responses = await Promise.allSettled(requests);

  const incidentResult = responses[0];
  if (incidentResult.status === "fulfilled" && incidentResult.value.ok) {
    const records = (await incidentResult.value.json()) as ApiIncident[];
    syncIncidentAnnotations(
      records.map(
        (record): Incident => ({
          id: record.id,
          kodamId: record.kodamId,
          time: record.incidentTime,
          eventDate: record.incidentDate,
          kodam: record.kodam.name,
          location: record.location,
          category: record.category,
          description: record.description,
          status: record.status,
          personnel: record.personnel,
          latitude: record.latitude,
          longitude: record.longitude,
          source: record.source,
        }),
      ),
    );
  }

  for (const [index, [, title]] of monitoringSources.entries()) {
    const result = responses[index + 1];
    if (result.status !== "fulfilled" || !result.value.ok) continue;
    const records = (await result.value.json()) as ApiMonitoringRecord[];
    syncOperationalAnnotations(title, records.map(monitoringRow));
  }

  const bangsitResult = responses[monitoringSources.length + 1];
  if (bangsitResult.status === "fulfilled" && bangsitResult.value.ok) {
    syncBangsitAnnotations((await bangsitResult.value.json()) as ApiBangsitArchive[]);
  }
  await syncAnnotationLayoutsFromServer();
}

export function useMapAnnotations() {
  const [items, setItems] = useState<MapAnnotation[]>([]);
  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let fallback: number | null = null;
    let reconnect: number | null = null;
    let refreshDelay: number | null = null;
    let attempts = 0;
    let reconciliation: Promise<void> | null = null;
    const refresh = () => setItems(loadMapAnnotations());
    const reconcile = () => {
      if (reconciliation) return reconciliation;
      reconciliation = reconcileWithServer().finally(() => {
        reconciliation = null;
      });
      return reconciliation;
    };
    const scheduleReconcile = () => {
      if (refreshDelay !== null) window.clearTimeout(refreshDelay);
      refreshDelay = window.setTimeout(() => {
        refreshDelay = null;
        void reconcile();
      }, 75);
    };
    const startFallback = () => {
      if (fallback !== null) return;
      fallback = window.setInterval(() => void reconcile(), 15_000);
    };
    const stopFallback = () => {
      if (fallback === null) return;
      window.clearInterval(fallback);
      fallback = null;
    };
    const connect = () => {
      if (!active || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING)
        return;
      socket = new WebSocket(realtimeWebSocketUrl(window.location));
      socket.addEventListener("open", () => {
        attempts = 0;
        stopFallback();
        void reconcile();
      });
      socket.addEventListener("message", (message) => {
        if (typeof message.data !== "string") return;
        const event = parseRealtimeInvalidation(message.data);
        if (!event) return;
        window.dispatchEvent(new CustomEvent(realtimeBrowserEvent, { detail: event }));
        if (event.resource === "map-points") return;
        scheduleReconcile();
      });
      socket.addEventListener("close", () => {
        socket = null;
        if (!active) return;
        startFallback();
        const delay = Math.min(1_000 * 2 ** attempts, 30_000);
        attempts += 1;
        reconnect = window.setTimeout(connect, delay);
      });
      socket.addEventListener("error", () => socket?.close());
    };
    const timer = setTimeout(refresh, 0);
    void reconcile();
    startFallback();
    connect();
    window.addEventListener(annotationEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      clearTimeout(timer);
      stopFallback();
      if (reconnect !== null) window.clearTimeout(reconnect);
      if (refreshDelay !== null) window.clearTimeout(refreshDelay);
      socket?.close();
      window.removeEventListener(annotationEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return items;
}
