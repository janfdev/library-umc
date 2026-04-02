import z from "zod";

export const sendFinesNotificationSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  name: z.string().min(1, "Nama wajib diisi"),
  amount: z.number().positive("Nominal denda harus bernilai positif"),
  bookTitle: z.string().min(1, "Judul buku wajib diisi"),
});

export const sendLoansNotificationSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  name: z.string().min(1, "Nama wajib diisi"),
  bookTitle: z.string().min(1, "Judul buku wajib diisi"),
  tanggalPengembalian: z.string().min(1, "Tanggal pengembalian wajib diisi"),
});
