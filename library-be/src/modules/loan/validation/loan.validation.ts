import z from "zod";

export const createLoanSchema = z.object({
  itemId: z.string().min(1, "Item ID wajib diisi"),
});

export const getLoansQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "returned", "overdue", "canceled"]).optional(),
  memberId: z.string().optional(),
});
