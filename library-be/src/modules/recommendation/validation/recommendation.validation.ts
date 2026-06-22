import z from "zod";

export const getRecommendationsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  dosenId: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const createRecommendationSchema = z.object({
  isbn: z.string().optional(), // ISBN for better deduplication
  title: z.string().min(1, "Judul buku wajib diisi"),
  author: z.string().min(1, "Penulis wajib diisi"),
  publisher: z.string().optional(),
  reason: z.string().min(1, "Alasan pengajuan wajib diisi")
});

export const updateRecommendationStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"])
});
