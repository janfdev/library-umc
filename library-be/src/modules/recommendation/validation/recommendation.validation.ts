import z from "zod";

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
