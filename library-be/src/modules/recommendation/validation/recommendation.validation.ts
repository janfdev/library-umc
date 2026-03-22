import z from "zod";

export const createRecommendationSchema = z.object({
  title: z.string().min(1, "Judul buku wajib diisi").max(255, "Judul maksimal 255 karakter"),
  author: z.string().min(1, "Nama penulis wajib diisi").max(255, "Penulis maksimal 255 karakter"),
  publisher: z.string().min(1, "Penerbit wajib diisi").max(255, "Penerbit maksimal 255 karakter"),
  reason: z.string().optional(),
});

export const updateRecommendationStatusSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    message: "Status tidak valid. Harus 'approved' atau 'rejected'."
  }),
});

export const getRecommendationsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});
