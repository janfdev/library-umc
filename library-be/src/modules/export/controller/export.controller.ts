import { type Request, type Response, type NextFunction } from "express";
import { exportService } from "../service/export.service";

export class ExportController {
  async exportBibliographies(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await exportService.exportBibliographies();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="bibliographies_export.csv"');
      res.send(csv);
    } catch (error) { next(error); }
  }

  async exportItems(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await exportService.exportItems();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="items_export.csv"');
      res.send(csv);
    } catch (error) { next(error); }
  }
}

export const exportController = new ExportController();
