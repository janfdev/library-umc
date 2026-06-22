import { db } from "../../../db";
import { categories, bibliographies } from "../../../db/schema";
import { eq, isNull, and } from "drizzle-orm";
import auditService from "../../audit/service/audit.service";

type CategoryData = {
  name: string;
  description: string;
};

type ServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export class CategoryService {
  /**
   * Get All Categories
   */
  async getAllCategories(): Promise<ServiceResponse<any[]>> {
    try {
      const result = await db
        .select()
        .from(categories)
        .where(isNull(categories.deletedAt));

      return {
        success: true,
        message: "Categories retrieved successfully",
        data: result,
      };
    } catch (err) {
      console.error("[CategoryService] Error getting categories:", err);
      return {
        success: false,
        message: "Failed to get categories",
        data: null,
      };
    }
  }

  /**
   * Create Category with duplicate check
   */
  async createCategory(
    data: CategoryData,
    userId?: string,
    ipAddress?: string,
  ): Promise<ServiceResponse<any>> {
    try {
      // Validate input
      if (!data.name || data.name.trim() === "") {
        return {
          success: false,
          message: "Category name is required",
          data: null,
        };
      }

      // Check for duplicate name (case-insensitive)
      const existingCategory = await db.query.categories.findFirst({
        where: and(
          eq(categories.name, data.name.trim()),
          isNull(categories.deletedAt),
        ),
      });

      if (existingCategory) {
        return {
          success: false,
          message: "Category with this name already exists",
          data: null,
        };
      }

      // Create category
      const categoryData = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [result] = await db
        .insert(categories)
        .values(categoryData)
        .returning();

      if (!result) {
        return {
          success: false,
          message: "Failed to create category",
          data: null,
        };
      }

      if (userId) {
        await auditService.createLog({
          userId,
          action: "create",
          entity: "category",
          entityId: result.id.toString(),
          ipAddress,
        });
      }

      return {
        success: true,
        message: "Category created successfully",
        data: result,
      };
    } catch (err) {
      console.error("[CategoryService] Error creating category:", err);
      return {
        success: false,
        message: "Failed to create category",
        data: null,
      };
    }
  }

  /**
   * Update Category with validation
   */
  async updateCategory(
    id: number,
    data: CategoryData,
    userId?: string,
    ipAddress?: string,
  ): Promise<ServiceResponse<any>> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        return {
          success: false,
          message: "Invalid category ID",
          data: null,
        };
      }

      // Check if category exists
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), isNull(categories.deletedAt)),
      });

      if (!existingCategory) {
        return {
          success: false,
          message: "Category not found",
          data: null,
        };
      }

      // Check for duplicate name (excluding current category)
      if (data.name && data.name.trim() !== existingCategory.name) {
        const duplicateCategory = await db.query.categories.findFirst({
          where: and(
            eq(categories.name, data.name.trim()),
            isNull(categories.deletedAt),
          ),
        });

        if (duplicateCategory && duplicateCategory.id !== id) {
          return {
            success: false,
            message: "Category with this name already exists",
            data: null,
          };
        }
      }

      // Update category
      const updateData = {
        name: data.name?.trim() || existingCategory.name,
        description: data.description?.trim() || existingCategory.description,
        updatedAt: new Date(),
      };

      const [updatedCategory] = await db
        .update(categories)
        .set(updateData)
        .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
        .returning();

      if (!updatedCategory) {
        return {
          success: false,
          message: "Failed to update category",
          data: null,
        };
      }

      if (userId) {
        await auditService.createLog({
          userId,
          action: "update",
          entity: "category",
          entityId: id.toString(),
          ipAddress,
        });
      }

      return {
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
      };
    } catch (err) {
      console.error("[CategoryService] Error updating category:", err);
      return {
        success: false,
        message: "Failed to update category",
        data: null,
      };
    }
  }

  /**
   * Delete Category with usage check
   */
  async deleteCategory(
    id: number,
    userId?: string,
    ipAddress?: string,
  ): Promise<ServiceResponse<any>> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        return {
          success: false,
          message: "Invalid category ID",
          data: null,
        };
      }

      // Check if category exists
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), isNull(categories.deletedAt)),
      });

      if (!existingCategory) {
        return {
          success: false,
          message: "Category not found",
          data: null,
        };
      }

      // Check if category is used by any bibliographies
      const usedByBibliographies = await db.query.bibliographies.findFirst({
        where: eq(bibliographies.categoryId, id),
      });

      if (usedByBibliographies) {
        return {
          success: false,
          message:
            "Cannot delete category. It is being used by one or more bibliographies",
          data: null,
        };
      }

      // Delete category
      const deletedCategory = await db
        .update(categories)
        .set({ deletedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();

      if (!deletedCategory || deletedCategory.length === 0) {
        return {
          success: false,
          message: "Failed to delete category",
          data: null,
        };
      }

      if (userId) {
        await auditService.createLog({
          userId,
          action: "delete",
          entity: "category",
          entityId: id.toString(),
          ipAddress,
        });
      }

      return {
        success: true,
        message: "Category deleted successfully",
        data: deletedCategory[0],
      };
    } catch (err) {
      console.error("[CategoryService] Error deleting category:", err);
      return {
        success: false,
        message: "Failed to delete category",
        data: null,
      };
    }
  }

  async getCategoryById(id: number): Promise<ServiceResponse<any>> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        return {
          success: false,
          message: "Invalid category ID",
          data: null,
        };
      }

      // Check if category exists
      const existingCategory = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), isNull(categories.deletedAt)),
      });

      if (!existingCategory) {
        return {
          success: false,
          message: "Category not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Category retrieved successfully",
        data: existingCategory,
      };
    } catch (err) {
      console.error("[CategoryService] Error getting category:", err);
      return {
        success: false,
        message: "Failed to get category",
        data: null,
      };
    }
  }
}
