import { type Request, type Response } from "express";
import { CollectionService } from "../service/collection.service";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../validation/collection.validation";

const collectionService = new CollectionService();

export class CollectionController {
  /**
   * Get All Collections
   */
  async getAllCollections(req: Request, res: Response) {
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
          | undefined,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("[CollectionController] Error getting collections:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * Get Collection By ID
   */
  async getCollectionById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const result = await collectionService.getCollectionById(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("[CollectionController] Error getting collection:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * Create Collection (with File Upload)
   */
  async createCollection(req: Request, res: Response) {
    try {
      // 1. Validation (req.body)
      const validation = createCollectionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      // 2. Process in Service
      const file = req.file;
      const result = await collectionService.createCollection(
        validation.data,
        file,
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // 201 Created
      res.status(201).json(result);
    } catch (err) {
      console.error("[CollectionController] Error creating collection:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  async updateCollection(req: Request, res: Response) {
    try {
      const validation = updateCollectionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const id = req.params.id as string;
      const file = req.file; // Support file upload for cover image

      const result = await collectionService.updateCollection(
        id,
        validation.data,
        file,
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("[Collection Controller] Error Updating Collection ", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  async deleteCollection(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const result = await collectionService.deleteCollection(id);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("[CollectionController] Error deleting collection:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }
}
