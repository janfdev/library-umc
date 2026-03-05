import { type Request, type Response, type NextFunction } from "express";
import finesService from "../service/fines.service";

class FinesController {
  async getAllFines(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, loanId, limit, offset } = req.query;

      const result = await finesService.getAllFines({
        status: status as "paid" | "unpaid",
        loanId: loanId as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFineById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await finesService.getFineById(id as string);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createFineManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanId, amount } = req.body;

      const result = await finesService.createFineManual(
        loanId as string,
        amount as number,
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async payFine(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const { paymentMethod } = req.body;

      const result = await finesService.payFine(
        id as string,
        adminId as string,
        paymentMethod as string,
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteFine(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await finesService.deleteFine(id as string);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new FinesController();
