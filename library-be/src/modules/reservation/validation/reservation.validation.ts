import z from "zod";

export const createReservationSchema = z.object({
  bibliographyId: z.string().min(1, "Bibliography ID dibutuhkan"),
});

export const getReservationsQuerySchema = z.object({
  status: z.enum(["waiting", "fulfilled", "canceled"]).optional(),
  memberId: z.string().optional(),
  bibliographyId: z.string().optional(),
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional(),
  offset: z.string().regex(/^\d+$/, "Offset harus berupa angka").optional(),
});
