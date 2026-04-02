import { type NextFunction, type Request, type Response } from "express";
import { ItemService } from "../service/item.service";
import {
  createItemSchema,
  updateItemSchema,
} from "../validation/item.validation";
import {
  sendSuccess,
  sendError,
  sendValidationError,
} from "../../../utils/api-utils";

const itemService = new ItemService();

export class ItemController {
  /**
   * GET /items — Ambil semua item fisik (opsional filter ?collectionId=)
   */
  async getAllItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionId } = req.query;
      const result = await itemService.getAllItems(collectionId as string);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /items/:id — Ambil item berdasarkan ID
   */
  async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.getItemById(String(req.params.id));

      if (!result.success) {
        return sendError(res, result.message ?? "Item tidak ditemukan", 404);
      }

      sendSuccess(res, "Data item berhasil diambil", result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /items — Buat item baru (Admin/Staff)
   */
  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createItemSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const result = await itemService.createItem(validation.data as any);

      if (!result.success) {
        return sendError(res, result.message ?? "Gagal membuat item", 400);
      }

      sendSuccess(res, "Item berhasil dibuat", result.data, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /items/:id — Update item (Admin/Staff)
   */
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = updateItemSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const result = await itemService.updateItem(
        String(req.params.id),
        validation.data as any,
      );

      if (!result.success) {
        const status = result.message === "Item not found" ? 404 : 400;
        return sendError(
          res,
          result.message ?? "Gagal memperbarui item",
          status,
        );
      }

      sendSuccess(res, "Item berhasil diperbarui", result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /items/:id — Hapus item (Admin/Staff)
   */
  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.deleteItem(String(req.params.id));

      if (!result.success) {
        const status = result.message === "Item not found" ? 404 : 400;
        return sendError(res, result.message ?? "Gagal menghapus item", status);
      }

      sendSuccess(res, "Item berhasil dihapus", null);
    } catch (error) {
      next(error);
    }
  }
}
