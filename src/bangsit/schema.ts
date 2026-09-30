import { z } from "zod";

export const bangsitArchiveSchema = z.object({
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  kodam: z.string().min(2).max(120),
  eventType: z.enum(["Bencana Alam", "Karhutla", "Unras"]),
  location: z.string().min(2).max(200),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  crowd: z.coerce.number().int().nonnegative().max(100_000_000),
  personnel: z.coerce.number().int().nonnegative().max(10_000_000),
  alut: z.string().max(500),
  chronology: z.string().min(5).max(10_000),
  status: z.enum(["NORMAL", "TERPANTAU", "WASPADA", "SIAGA", "DARURAT", "SELESAI"]),
});

export type BangsitArchiveInput = z.infer<typeof bangsitArchiveSchema>;
