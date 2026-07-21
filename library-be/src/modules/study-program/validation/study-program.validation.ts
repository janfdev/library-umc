import z from "zod";

export const createStudyProgramSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().optional().or(z.literal("")),
  facultyId: z.coerce.number().int().positive("Faculty is required"),
});

export const updateStudyProgramSchema = createStudyProgramSchema.partial();
