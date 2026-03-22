import z from "zod";

export const createReservationSchema = z.object({
  collectionId: z.string().min(1, "Collection ID dibutuhkan"),
});

export const getReservationsQuerySchema = z.object({
  status: z.enum(["waiting", "fulfilled", "canceled"]).optional(),
  memberId: z.string().optional(),
  collectionId: z.string().optional(),
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional(),
  offset: z.string().regex(/^\d+$/, "Offset harus berupa angka").optional(),
});
