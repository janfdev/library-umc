import { type Request, type Response, type NextFunction } from "express";
import recommendationsService from "../service/recommendations.service";

class RecommendationsController {
  async createRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      }

      const { title, author, publisher, reason } = req.body;

      const result = await recommendationsService.createRecommendation(
        dosenId,
        {
          title,
          author,
          publisher,
          reason,
        },
      );

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;

      const result = await recommendationsService.getAllRecommendations({
        status: status as "pending" | "approved" | "rejected",
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMyRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const dosenId = req.user?.id;
      if (!dosenId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      }

      const result = await recommendationsService.getMyRecommendations(dosenId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateRecommendationStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || (status !== "approved" && status !== "rejected")) {
        return res.status(400).json({
          success: false,
          message: "Status tidak valid. Harus 'approved' atau 'rejected'.",
        });
      }

      const result = await recommendationsService.updateRecommendationStatus(
        id as string,
        status,
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await recommendationsService.deleteRecommendation(
        id as string,
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new RecommendationsController();
