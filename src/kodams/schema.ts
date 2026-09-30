import { z } from "zod";

export const kodamUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(1).max(40),
  region: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(["KONDUSIF", "WASPADA", "SIAGA"]),
  personnel: z.number().int().nonnegative().max(10_000_000),
  incidentCount: z.number().int().nonnegative().max(10_000_000).optional(),
  deployed: z.number().int().nonnegative().max(10_000_000).optional(),
});

export const kodamCreateSchema = kodamUpdateSchema
  .omit({ incidentCount: true })
  .extend({
    deployed: z.number().int().nonnegative().max(10_000_000).default(0),
  })
  .refine((value) => value.deployed <= value.personnel, {
    error: "Jumlah personel dikerahkan tidak boleh melebihi jumlah personel",
    path: ["deployed"],
  });
