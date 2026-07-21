import z from "zod";

export const createFacultySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().optional().or(z.literal("")),
});

export const updateFacultySchema = createFacultySchema.partial();
