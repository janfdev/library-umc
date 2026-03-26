import { type NextFunction, type Request, type Response } from "express";
import auditService from "../service/audit.service";


class AuditController {
  /**
   * GET /audit — Ambil log aktivitas sistem (Admin)
   */
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, entity, limit, offset } = req.query;

      const result = await auditService.getLogs({
        action: action as string,
        entity: entity as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditController();
