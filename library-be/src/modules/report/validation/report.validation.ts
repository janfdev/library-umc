import z from "zod";

export const getPopularBooksQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional(),
});

export const exportLoansQuerySchema = z.object({
  format: z.enum(["csv", "pdf"]).optional().default("csv"),
  status: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD (contoh: 2025-01-01)").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD (contoh: 2025-01-01)").optional(),
});

export const exportFinesQuerySchema = z.object({
  format: z.enum(["csv", "pdf"]).optional().default("csv"),
  status: z.string().optional(),
});
