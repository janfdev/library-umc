import z from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter"),
});

export const loginCredentialSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});
