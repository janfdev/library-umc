import { type Request, type Response } from "express";
import { type ZodSchema, ZodError, type ZodIssue } from "zod";
import { auth } from "../lib/auth";



/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(req: Request) {
  try {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers[key] = Array.isArray(value) ? value[0] : value;
      }
    }

    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Validate request body with Zod schema
 */
export function validateRequestBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): { data: T; error: null } | { data: null; error: string } {
  try {
    const body = req.body;
    const validatedData = schema.parse(body);
    return { data: validatedData, error: null };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map((err: ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { data: null, error: errorMessage };
    }
    return { data: null, error: "Invalid request body" };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  req: Request,
  schema: ZodSchema<T>,
): { data: T; error: null } | { data: null; error: string } {
  try {
    const params = req.query;
    const validatedData = schema.parse(params);
    return { data: validatedData, error: null };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map((err: ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { data: null, error: errorMessage };
    }
    return { data: null, error: "Invalid query parameters" };
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate unique slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Calculate offset for pagination
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
) {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================================
// ✅ STANDAR FORMAT RESPONSE — gunakan fungsi-fungsi di bawah
//    untuk semua controller, baik baru maupun yang direfactor
// ============================================================

/**
 * Format standar envelope response seluruh proyek:
 *   { success: boolean, message: string, data: T | null }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Kirim response **sukses** dengan format standar.
 *
 * @param res     - Express Response object
 * @param message - Pesan singkat deskriptif (bahasa Indonesia)
 * @param data    - Payload data yang dikembalikan ke klien
 * @param status  - HTTP status code (default: 200, gunakan 201 untuk create)
 *
 * @example
 * sendSuccess(res, "Data berhasil diambil", items);
 * sendSuccess(res, "Koleksi berhasil dibuat", newCollection, 201);
 */
export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  status: number = 200,
): void {
  res.status(status).json({
    success: true,
    message,
    data,
  } satisfies ApiResponse<T>);
}

/**
 * Kirim response **error** dengan format standar.
 * Field `data` selalu `null` pada response error.
 *
 * @param res     - Express Response object
 * @param message - Pesan error yang jelas (bahasa Indonesia)
 * @param status  - HTTP status code (default: 400)
 *
 * @example
 * sendError(res, "Data tidak ditemukan", 404);
 * sendError(res, "Tidak memiliki akses", 403);
 * sendError(res, "Token tidak valid", 401);
 */
export function sendError(
  res: Response,
  message: string,
  status: number = 400,
): void {
  res.status(status).json({
    success: false,
    message,
    data: null,
  } satisfies ApiResponse<null>);
}

/**
 * Kirim response **validation error** (400) dengan detail field error dari Zod.
 * Gunakan ini setelah `schema.safeParse()` gagal.
 *
 * @example
 * const v = schema.safeParse(req.body);
 * if (!v.success) return sendValidationError(res, v.error.flatten());
 */
export function sendValidationError(
  res: Response,
  errors: ReturnType<ZodError["flatten"]>,
): void {
  res.status(400).json({
    success: false,
    message: "Validation Error",
    data: errors,
  });
}
