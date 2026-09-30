export type AnnotationCategory = "BENCANA" | "KARHUTLA" | "UNRAS";
export type AnnotationStatus = "NORMAL" | "TERPANTAU" | "WASPADA" | "SIAGA" | "DARURAT" | "SELESAI";
export type AnnotationPosition =
  | "auto"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export interface MapAnnotation {
  id: string;
  incidentId: string;
  source?: "DUMMY" | "BANGSIT" | "KEJADIAN" | "BENCANA" | "KARHUTLA" | "UNRAS";
  sourceId?: string;
  kodam: string;
  category: AnnotationCategory;
  latitude: number;
  longitude: number;
  title: string;
  location: string;
  time: string;
  eventDate?: string;
  status: AnnotationStatus;
  annotationPosition: AnnotationPosition;
  annotationOffsetX?: number;
  annotationOffsetY?: number;
  personnel: number;
  hotspot?: number;
  affectedArea?: number;
  affectedAreaUnit?: string;
  alut?: string;
  disasterType?: string;
  affectedFamilies?: number;
  crowdEstimate?: number;
  organization?: string;
  updatedAt: string;
}
