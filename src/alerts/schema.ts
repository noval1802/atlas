import { z } from "zod";

export const alertSchema = z.object({
  incidentId: z.string().trim().min(1).max(160).nullable().optional(),
  level: z.enum(["INFO", "WARNING", "CRITICAL"]),
  title: z.string().trim().min(3).max(180),
  message: z.string().trim().min(3).max(4000),
  kodam: z.string().trim().min(2).max(120),
  metric: z.string().trim().min(1).max(120),
  status: z.enum(["KONDUSIF", "WASPADA", "SIAGA"]),
});
