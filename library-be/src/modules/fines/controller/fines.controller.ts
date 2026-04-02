import { type Request, type Response, type NextFunction } from "express";
import finesService from "../service/fines.service";
import { getFinesQuerySchema, createFineSchema, payFineSchema } from "../validation/fines.validation";

class FinesController {
  async getAllFines(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = getFinesQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
      }

      const { status, loanId, limit, offset } = validation.data;

      const result = await finesService.getAllFines({
        status: status as "paid" | "unpaid",
        loanId,
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
      const validation = createFineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
      }

      const { loanId, amount } = validation.data;

      const result = await finesService.createFineManual(
        loanId,
        amount,
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
      const validation = payFineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
      }
      
      const { paymentMethod } = validation.data;

      const result = await finesService.payFine(
        id as string,
        adminId as string,
        paymentMethod,
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
