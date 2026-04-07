import { type NextFunction, type Request, type Response } from "express";
import { CollectionService } from "../service/collection.service";
import {
  createCollectionSchema,
  updateCollectionSchema
} from "../validation/collection.validation";
import {
  sendSuccess,
  sendError,
  sendValidationError
} from "../../../utils/api-utils";

const collectionService = new CollectionService();

export class CollectionController {
  async downloadImportTemplate(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const buffer =
        await collectionService.getCollectionImportTemplateBuffer();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="collections-import-template.xlsx"'
      );

      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async importCollections(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendError(res, "File import wajib diunggah", 400);
      }

      const result = await collectionService.importCollectionsFromFile(
        req.file
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message ?? "Gagal import koleksi",
          data: result.data
        });
      }

      sendSuccess(res, "Import koleksi berhasil", result.data, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /collections — Ambil semua koleksi (dengan filter opsional)
   */
  async getAllCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, categoryId, type } = req.query;

      const result = await collectionService.getAllCollections({
        search: search as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        type: type as
          | "physical_book"
          | "ebook"
          | "journal"
          | "thesis"
          | undefined
      });

      if (!result.success) {
        return sendError(
          res,
          result.message ?? "Gagal mengambil data koleksi",
          400
        );
      }

      sendSuccess(res, "Data koleksi berhasil diambil", result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /collections/:id — Ambil koleksi berdasarkan ID
   */
  async getCollectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await collectionService.getCollectionById(
        String(req.params.id)
      );

      if (!result.success) {
        return sendError(res, result.message ?? "Koleksi tidak ditemukan", 404);
      }

      sendSuccess(res, "Data koleksi berhasil diambil", result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /collections — Buat koleksi baru (Admin/Staff)
   */
  async createCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createCollectionSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const result = await collectionService.createCollection(
        validation.data,
        req.file
      );

      if (!result.success) {
        return sendError(res, result.message ?? "Gagal membuat koleksi", 400);
      }

      sendSuccess(res, "Koleksi berhasil dibuat", result.data, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /collections/:id — Update koleksi (Admin/Staff)
   */
  async updateCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = updateCollectionSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const result = await collectionService.updateCollection(
        String(req.params.id),
        validation.data,
        req.file
      );

      if (!result.success) {
        return sendError(
          res,
          result.message ?? "Gagal memperbarui koleksi",
          400
        );
      }

      sendSuccess(res, "Koleksi berhasil diperbarui", result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /collections/:id — Hapus koleksi (Admin/Staff)
   */
  async deleteCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await collectionService.deleteCollection(
        String(req.params.id)
      );

      if (!result.success) {
        return sendError(res, result.message ?? "Gagal menghapus koleksi", 400);
      }

      sendSuccess(res, "Koleksi berhasil dihapus", null);
    } catch (error) {
      next(error);
    }
  }
}
