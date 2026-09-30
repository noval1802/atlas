export type Status = "KONDUSIF" | "WASPADA" | "SIAGA";
export type AlertLevel = "INFO" | "WARNING" | "CRITICAL";
export interface Incident {
  id: string;
  kodamId?: string;
  time: string;
  eventDate?: string;
  kodam: string;
  location: string;
  category: string;
  description: string;
  status: Status;
  personnel: number;
  latitude: number;
  longitude: number;
  source?: string | null;
}
export interface AlertItem {
  id: string;
  level: AlertLevel;
  kodam: string;
  title: string;
  detail: string;
  metric: string;
  status: Status;
  time: string;
}
