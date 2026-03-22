import { db } from "../../../db";
import { items, collections, locations } from "../../../db/schema";
import { eq, and, like, isNull } from "drizzle-orm";
import {
  type createItemSchema,
  type updateItemSchema,
} from "../validation/item.validation";
import { type z } from "zod";

type CreateItemData = z.infer<typeof createItemSchema>;
type UpdateItemData = z.infer<typeof updateItemSchema>;

export class ItemService {
  /**
   * Get All Items (Filtered by Collection ID if provided)
   */
  async getAllItems(collectionId?: string) {
    let whereClause: any = isNull(items.deletedAt);
    if (collectionId) {
      whereClause = and(
        eq(items.collectionId, collectionId),
        isNull(items.deletedAt),
      );
    }

    const result = await db.query.items.findMany({
      where: whereClause,
      with: {
        collection: true,
        location: true,
      },
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    return {
      success: true,
      message: "Items retrieved successfully",
      data: result,
    };
  }

  /**
   * Get Item By ID
   */
  async getItemById(id: string) {
    const result = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
      with: {
        collection: true,
        location: true,
      },
    });

    if (!result) {
      return {
        success: false,
        message: "Item not found",
        data: null,
      };
    }

    return {
      success: true,
      message: "Item retrieved successfully",
      data: result,
    };
  }

  /**
   * Get Item By Barcode
   */
  async getItemByBarcode(barcode: string) {
    const result = await db.query.items.findFirst({
      where: and(eq(items.barcode, barcode), isNull(items.deletedAt)),
      with: {
        collection: true,
        location: true,
      },
    });

    if (!result) {
      return {
        success: false,
        message: "Item not found",
        data: null,
      };
    }

    return {
      success: true,
      message: "Item retrieved successfully",
      data: result,
    };
  }

  /**
   * Create New Item
   */
  async createItem(data: CreateItemData) {
    // Check if barcode already exists
    const existing = await db.query.items.findFirst({
      where: and(eq(items.barcode, data.barcode), isNull(items.deletedAt)),
    });

    if (existing) {
      return {
        success: false,
        message: "Barcode already exists",
      };
    }

    // Check if collection exists
    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, data.collectionId),
    });

    if (!collection) {
      return {
        success: false,
        message: "Collection not found",
      };
    }

    // Check if location exists
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, data.locationId),
    });

    if (!location) {
      return {
        success: false,
        message: "Location not found",
      };
    }

    const [newItem] = await db.insert(items).values(data).returning();

    return {
      success: true,
      message: "Item created successfully",
      data: newItem,
    };
  }

  /**
   * Update Item
   */
  async updateItem(id: string, data: UpdateItemData) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });

    if (!existingItem) {
      return {
        success: false,
        message: "Item not found",
      };
    }

    // If updating barcode, check for duplicates
    if (data.barcode && data.barcode !== existingItem.barcode) {
      const duplicate = await db.query.items.findFirst({
        where: and(eq(items.barcode, data.barcode), isNull(items.deletedAt)),
      });

      if (duplicate) {
        return {
          success: false,
          message: "Barcode already exists",
        };
      }
    }

    const [updatedItem] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();

    return {
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    };
  }

  /**
   * Delete Item
   */
  async deleteItem(id: string) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });

    if (!existingItem) {
      return {
        success: false,
        message: "Item not found",
      };
    }

    // Check if item has loan history?
    // Usually hard delete is risky if there are active loans.
    // Assuming schema has cascading or we check status.
    if (existingItem.status === "loaned") {
      return {
        success: false,
        message: "Cannot delete item that is currently loaned",
      };
    }

    await db
      .update(items)
      .set({ deletedAt: new Date(), status: "lost" })
      .where(eq(items.id, id));

    return {
      success: true,
      message: "Item deleted successfully",
    };
  }
}
