import { type NextFunction, type Request, type Response } from "express";
import { CategoryService } from "../service/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation/category.validation";
import {
  sendSuccess,
  sendError,
  sendValidationError,
} from "../../../utils/api-utils";

const categoryService = new CategoryService();

export class CategoryController {
  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.getAllCategories();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = parseInt(String(req.params.id));
      if (isNaN(categoryId)) return sendError(res, "ID kategori tidak valid", 400);

      const result = await categoryService.getCategoryById(categoryId);
      if (!result.success) return sendError(res, result.message ?? "Kategori tidak ditemukan", 404);

      sendSuccess(res, "Data kategori berhasil diambil", result.data);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createCategorySchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());

      const userId = req.user?.id ?? "";
      const ipAddress = req.ip ?? "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await categoryService.createCategory(validation.data as any, userId, ipAddress);
      sendSuccess(res, "Kategori berhasil dibuat", result.data, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = parseInt(String(req.params.id));
      if (isNaN(categoryId)) return sendError(res, "ID kategori tidak valid", 400);

      const validation = updateCategorySchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());

      const userId = req.user?.id ?? "";
      const ipAddress = req.ip ?? "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await categoryService.updateCategory(categoryId, validation.data as any, userId, ipAddress);
      if (!result.success) return sendError(res, result.message ?? "Kategori tidak ditemukan", 404);

      sendSuccess(res, "Kategori berhasil diperbarui", result.data);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = parseInt(String(req.params.id));
      if (isNaN(categoryId)) return sendError(res, "ID kategori tidak valid", 400);

      const userId = req.user?.id ?? "";
      const ipAddress = req.ip ?? "";

      const result = await categoryService.deleteCategory(categoryId, userId, ipAddress);
      if (!result.success) return sendError(res, result.message ?? "Kategori tidak ditemukan", 404);

      sendSuccess(res, "Kategori berhasil dihapus", null);
    } catch (error) {
      next(error);
    }
  }
}
