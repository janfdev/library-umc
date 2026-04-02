import { type Request, type Response, type NextFunction } from "express";
import auditService from "../service/audit.service";

class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, entity, limit, offset } = req.query;

      const result = await auditService.getLogs({
        action: action as string,
        entity: entity as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditController();
