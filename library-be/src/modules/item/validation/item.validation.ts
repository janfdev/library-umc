import { z } from "zod";

export const itemStatusSchema = z.enum([
  "available",
  "loaned",
  "damaged",
  "lost",
]);

export const createItemSchema = z.object({
  collectionId: z.string().uuid(),
  locationId: z.number().int(),
  barcode: z.string().min(1).max(50),
  uniqueCode: z.string().min(1).max(30).optional(),
  status: itemStatusSchema.default("available"),
});

export const updateItemSchema = z.object({
  collectionId: z.string().uuid().optional(),
  locationId: z.number().int().optional(),
  barcode: z.string().min(1).max(50).optional(),
  uniqueCode: z.string().min(1).max(30).optional(),
  status: itemStatusSchema.optional(),
});
