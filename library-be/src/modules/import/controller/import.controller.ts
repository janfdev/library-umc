import { type Request, type Response, type NextFunction } from "express";
import { importService } from "../service/import.service";
import { sendSuccess, sendError } from "../../../utils/api-utils";

export class ImportController {
  async uploadBibliography(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) return sendError(res, "No file uploaded", 400);
      const content = req.file.buffer.toString("utf-8");
      const batch = await importService.createBatch("bibliography", req.file.originalname, (req as any).user.id, content);
      sendSuccess(res, "File uploaded", { batchId: batch.id, filename: batch.filename }, 201);
    } catch (error) { next(error); }
  }

  async uploadItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) return sendError(res, "No file uploaded", 400);
      const content = req.file.buffer.toString("utf-8");
      const batch = await importService.createBatch("item", req.file.originalname, (req as any).user.id, content);
      sendSuccess(res, "File uploaded", { batchId: batch.id, filename: batch.filename }, 201);
    } catch (error) { next(error); }
  }

  async parseBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await importService.parseBatch(req.params.batchId as string);
      sendSuccess(res, "Batch parsed", result);
    } catch (error) { next(error); }
  }

  async previewBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await importService.previewBatch(req.params.batchId as string, limit);
      sendSuccess(res, "Preview retrieved", result);
    } catch (error) { next(error); }
  }

  async approveBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await importService.approveBatch(req.params.batchId as string, (req as any).user.id);
      sendSuccess(res, "Batch committed", result);
    } catch (error) { next(error); }
  }

  async downloadErrors(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await importService.downloadErrors(req.params.batchId as string);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="errors-${req.params.batchId}.csv"`);
      res.send("\uFEFF" + csv);
    } catch (error) { next(error); }
  }

  async listBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const batches = await importService.listBatches();
      sendSuccess(res, "Batches retrieved", batches);
    } catch (error) { next(error); }
  }

  async getBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await importService.getBatch(req.params.batchId as string);
      if (!batch) return sendError(res, "Batch not found", 404);
      sendSuccess(res, "Batch retrieved", batch);
    } catch (error) { next(error); }
  }
}

export const importController = new ImportController();
