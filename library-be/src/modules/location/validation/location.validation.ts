import z from "zod";

export const createLocationSchema = z.object({
  room: z.string().trim().min(1, "Room wajib diisi").max(200, "Panjang room tidak boleh melebihi 200 karakter"),
  rack: z.string().trim().min(1, "Rack wajib diisi").max(200, "Panjang rack tidak boleh melebihi 200 karakter"),
  shelf: z.string().trim().min(1, "Shelf wajib diisi").max(200, "Panjang shelf tidak boleh melebihi 200 karakter"),
});

export const updateLocationSchema = createLocationSchema.partial();
