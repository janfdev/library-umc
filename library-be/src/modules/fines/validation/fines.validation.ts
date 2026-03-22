import z from "zod";

export const getFinesQuerySchema = z.object({
  status: z.enum(["paid", "unpaid"]).optional(),
  loanId: z.string().optional(),
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional(),
  offset: z.string().regex(/^\d+$/, "Offset harus berupa angka").optional(),
});

export const createFineSchema = z.object({
  loanId: z.string().min(1, "Loan ID wajib diisi"),
  amount: z.number().positive("Amount harus bernilai positif"),
});

export const payFineSchema = z.object({
  paymentMethod: z.string().min(1, "Metode pembayaran wajib diisi"),
});
