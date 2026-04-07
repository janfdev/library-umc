import { z } from "zod";

// Helper: Convert string to number (karena multipart form data mengirim angka sebagai string)
const strToNum = (val: unknown) => {
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
};

const trimString = (val: unknown) => {
  if (typeof val === "string") {
    return val.trim();
  }
  return val;
};

const emptyStringToUndefined = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return val;
};

export const createCollectionSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(255),
  author: z.string().min(2, "Penulis minimal 2 karakter").max(255),
  publisher: z.string().min(2, "Penerbit minimal 2 karakter").max(150),
  publicationYear: z
    .string()
    .regex(/^\d{4}$/, "Tahun publikasi harus 4 digit angka (YYYY)"),
  isbn: z
    .string()
    .max(25)
    .regex(
      /^[0-9Xx\-\s]*$/,
      "ISBN hanya boleh berisi angka, X, dan penghubung (-)"
    )
    .optional(),

  // Enum type sesuai database
  type: z.enum(["physical_book", "ebook", "journal", "thesis"]),

  categoryId: z.preprocess(strToNum, z.number().positive()),

  description: z.string().optional(),

  // Stock/Quantity of the collection
  stock: z.preprocess(strToNum, z.number().int().min(0).default(0)).optional()
});

// Schema update (semua field optional)
export const updateCollectionSchema = createCollectionSchema.partial();

export const importCollectionRowSchema = z.object({
  title: z.preprocess(trimString, z.string().min(3).max(255)),
  author: z.preprocess(trimString, z.string().min(2).max(255)),
  publisher: z.preprocess(trimString, z.string().min(2).max(150)),
  publicationYear: z.preprocess(
    trimString,
    z.string().regex(/^[0-9]{4}$/, "publicationYear harus format YYYY")
  ),
  isbn: z
    .preprocess(emptyStringToUndefined, z.string().max(25).optional())
    .refine(
      (value) => value === undefined || /^[0-9Xx\-\s]*$/.test(value),
      "ISBN hanya boleh berisi angka, X, dan penghubung (-)"
    ),
  type: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.enum(["physical_book", "ebook", "journal", "thesis"])
  ),
  categoryId: z.preprocess(strToNum, z.number().int().positive()),
  description: z.preprocess(emptyStringToUndefined, z.string().optional()),
  stock: z.preprocess(strToNum, z.number().int().min(0).default(0)).optional()
});

export type ImportCollectionRow = z.infer<typeof importCollectionRowSchema>;
