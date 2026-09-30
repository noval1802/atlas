import { z } from "zod";

export const mapPointSchema = z.object({
  title: z.string().trim().min(3).max(160),
  kodam: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(4000).default(""),
  status: z.enum(["KONDUSIF", "WASPADA", "SIAGA"]),
  personnel: z.number().int().min(0).max(10_000_000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
