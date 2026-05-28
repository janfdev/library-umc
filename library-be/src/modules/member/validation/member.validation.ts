import z from "zod";

export const updateProfileSchema = z.object({
  nimNidn: z.string().max(50).optional().or(z.literal("")),
  faculty: z.string().max(200).optional().or(z.literal("")),
  originRegion: z.string().max(255).optional().or(z.literal("")),
  institution: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(100).optional().or(z.literal(""))
});

export const approveCardSchema = z.object({
  cardNumber: z.string().min(6).max(100).optional()
});

export const rejectCardSchema = z.object({
  reason: z.string().min(3, "Reason is required").max(255)
});
