import { type Request, type Response, type NextFunction } from "express";
import { itemService } from "../service/item.service";
import {
  createItemSchema, bulkCreateItemSchema, updateItemSchema,
  updateItemStatusSchema, updateItemLocationSchema,
} from "../validation/item.validation";
import { sendSuccess, sendError, sendValidationError } from "../../../utils/api-utils";
import auditService from "../../audit/service/audit.service";
import qrcode from "qrcode";

export class ItemController {

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const bibliographyId = req.query.bibliographyId as string | undefined;
      const result = await itemService.getAllItems(bibliographyId);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.getItemById(req.params.id as string);
      if (!result.success) return sendError(res, result.message, 404);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Merge bibliographyId from URL params into body for validation
      const bibId = req.params.bibliographyId as string;
      const bodyData = bibId ? { ...req.body, bibliographyId: bibId } : req.body;
      const validation = createItemSchema.safeParse(bodyData);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await itemService.createItem(validation.data);
      if (!result.success) return sendError(res, result.message, 400);
      if (result.data) {
        await auditService.createLog({ action: "create", entity: "item", entityId: result.data.id, userId: (req as any).user?.id, ipAddress: req.ip });
      }
      sendSuccess(res, result.message, result.data, 201);
    } catch (error) { next(error); }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const bibId = req.params.bibliographyId as string;
      const validation = bulkCreateItemSchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await itemService.bulkCreate(bibId, validation.data);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, result.data, 201);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = updateItemSchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await itemService.updateItem(req.params.id as string, validation.data);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = updateItemStatusSchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await itemService.updateItemStatus(req.params.id as string, validation.data.status);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = updateItemLocationSchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await itemService.updateItemLocation(req.params.id as string, validation.data.locationId);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.deleteItem(req.params.id as string);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, null);
    } catch (error) { next(error); }
  }

  async getQr(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.getItemById(req.params.id as string);
      if (!result.success || !result.data) return sendError(res, "Item not found", 404);
      const format = req.query.format as string || "svg";
      if (format === "png") {
        const png = await qrcode.toBuffer(result.data.qrToken || "", { width: 300, errorCorrectionLevel: "H" });
        res.setHeader("Content-Type", "image/png");
        res.send(png);
      } else {
        const svg = await qrcode.toString(result.data.qrToken || "", { type: "svg" });
        res.setHeader("Content-Type", "image/svg+xml");
        res.send(svg);
      }
    } catch (error) { next(error); }
  }

  async regenerateQr(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.regenerateQr(req.params.id as string, (req as any).user?.id);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async revokeQr(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.revokeQr(req.params.id as string, (req as any).user?.id);
      if (!result.success) return sendError(res, result.message, 400);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async resolveQr(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemService.resolveByQrToken(req.params.token as string);
      if (!item) return sendError(res, "QR not found or revoked", 404);
      sendSuccess(res, "QR resolved", item);
    } catch (error) { next(error); }
  }

  async bulkLabels(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = (req.query.ids as string || "").split(",").filter(Boolean);
      if (ids.length === 0) return sendError(res, "No IDs provided", 400);
      const data = await itemService.getBulkLabelData(ids);
      sendSuccess(res, "Label data retrieved", data);
    } catch (error) { next(error); }
  }
}

export const itemController = new ItemController();
