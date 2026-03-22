import { type Request, type Response } from "express";
import { ItemService } from "../service/item.service";
import {
  createItemSchema,
  updateItemSchema,
} from "../validation/item.validation";

const itemService = new ItemService();

export class ItemController {
  /**
   * Get All Items (Public or Auth User)
   * Optionally filter by collectionId ?collectionId=...
   */
  async getAllItems(req: Request, res: Response) {
    try {
      const { collectionId } = req.query;
      const result = await itemService.getAllItems(collectionId as string);

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[ItemController] Error getting items:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Get Item By ID
   */
  async getItemById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const result = await itemService.getItemById(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[ItemController] Error getting item by ID:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Create Item (Admin/Staff Only)
   */
  async createItem(req: Request, res: Response) {
    try {
      const validation = createItemSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const result = await itemService.createItem(validation.data as any);

      if (!result.success) {
        res.status(400).json(result); // Generic bad request (e.g. barcode exists)
        return;
      }

      res.status(201).json(result);
    } catch (err: any) {
      console.error("[ItemController] Error creating item:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Update Item (Admin/Staff Only)
   */
  async updateItem(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const validation = updateItemSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const result = await itemService.updateItem(id, validation.data as any);

      if (!result.success) {
        if (result.message === "Item not found") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[ItemController] Error updating item:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }

  /**
   * Delete Item (Admin/Staff Only)
   */
  async deleteItem(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const result = await itemService.deleteItem(id);

      if (!result.success) {
        if (result.message === "Item not found") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[ItemController] Error deleting item:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
