import { type Request, type Response } from "express";
import { CategoryService } from "../service/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation/category.validation";

const categoryService = new CategoryService();

export class CategoryController {
  /**
   * Get All Categories
   */
  async getAllCategories(req: Request, res: Response) {
    try {
      const result = await categoryService.getAllCategories();
      res.status(200).json(result);
    } catch (err: any) {
      console.error("[CategoryController] Error getting categories:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Get Category By ID
   */
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const categoryId = parseInt(id);

      if (isNaN(categoryId)) {
        res.status(400).json({
          success: false,
          message: "Invalid Category ID",
        });
        return;
      }

      const result = await categoryService.getCategoryById(categoryId);
      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[CategoryController] Error getting category by ID:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Create New Category (Admin Only)
   */
  async createCategory(req: Request, res: Response) {
    try {
      // Role Validation handled in middleware
      const validation = createCategorySchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const userId = (req as any).user?.id || "";
      const ipAddress = req.ip || "";

      const result = await categoryService.createCategory(
        validation.data as any,
        userId,
        ipAddress,
      );
      res.status(201).json(result);
    } catch (err: any) {
      console.error("[CategoryController] Error creating category:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Update Category (Admin Only)
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const categoryId = parseInt(id);

      if (isNaN(categoryId)) {
        res.status(400).json({
          success: false,
          message: "Invalid Category ID",
        });
        return;
      }

      const validation = updateCategorySchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const userId = (req as any).user?.id || "";
      const ipAddress = req.ip || "";

      const result = await categoryService.updateCategory(
        categoryId,
        validation.data as any,
        userId,
        ipAddress,
      );
      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[CategoryController] Error updating category:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Delete Category (Admin Only)
   */
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const categoryId = parseInt(id);

      if (isNaN(categoryId)) {
        res.status(400).json({
          success: false,
          message: "Invalid Category ID",
        });
        return;
      }

      const userId = (req as any).user?.id || "";
      const ipAddress = req.ip || "";

      const result = await categoryService.deleteCategory(
        categoryId,
        userId,
        ipAddress,
      );
      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[CategoryController] Error deleting category:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
