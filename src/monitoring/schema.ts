import { z } from "zod";

export const operationalRecordSchema = z.object({
  primary: z.string().trim().min(1).max(200),
  secondary: z.string().trim().min(1).max(200),
  detail: z.string().trim().min(1).max(500),
  status: z.string().trim().min(1).max(40),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  crowdEstimate: z.number().int().nonnegative().nullable().optional(),
  personnel: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const operationalResetSchema = z.object({ rows: z.array(operationalRecordSchema).max(500) });

export function hasRequiredUnrasMetrics(record: {
  crowdEstimate?: number | null;
  personnel?: number | null;
}) {
  return (
    record.crowdEstimate !== null &&
    record.crowdEstimate !== undefined &&
    record.personnel !== null &&
    record.personnel !== undefined
  );
}
