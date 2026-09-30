import { z } from "zod";
export const incidentSchema = z.object({
  kodamId: z.string().min(1),
  category: z.string().min(2).max(80),
  title: z.string().min(3).max(160),
  description: z.string().min(5).max(5000),
  location: z.string().min(2).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  incidentDate: z.coerce.date(),
  incidentTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["KONDUSIF", "WASPADA", "SIAGA"]),
  personnel: z.number().int().nonnegative().default(0),
  crowdEstimate: z.number().int().nonnegative().default(0),
  source: z.string().max(250).optional(),
});
