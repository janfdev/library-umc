import z from "zod";

export const createLoanSchema = z.object({
  collectionId: z.string().min(1, "Collection ID wajib diisi"),
  loanDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export const getLoansQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "returned", "overdue", "canceled"]).optional(),
  memberId: z.string().optional(),
});
