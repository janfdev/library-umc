import { type NextFunction, type Request, type Response } from "express";
import reservationService from "../service/reservation.service";
import { MemberService } from "../../member/service/member.service";
import { BadRequestError } from "../../../exceptions/AppError";
import { createReservationSchema, getReservationsQuerySchema } from "../validation/reservation.validation";
import { sendValidationError } from "../../../utils/api-utils";

const memberService = new MemberService();

class ReservationController {
  private async getMemberId(userId: string): Promise<string> {
    const memberRes = await memberService.getMemberByUserId(userId);
    if (!memberRes.success || !memberRes.data) {
      throw new BadRequestError(
        "Profil member tidak ditemukan. Silakan lengkapi profil Anda terlebih dahulu.",
      );
    }
    return memberRes.data.id;
  }

  async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Tidak terautentikasi",
          data: null,
        });
      }

      const validation = createReservationSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const memberId = await this.getMemberId(req.user.id);
      const result = await reservationService.createReservation(memberId, validation.data.collectionId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Tidak terautentikasi",
          data: null,
        });
      }

      const memberId = await this.getMemberId(req.user.id);
      const result = await reservationService.cancelReservation(String(req.params.id), memberId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMyReservations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Tidak terautentikasi",
          data: null,
        });
      }

      const memberId = await this.getMemberId(req.user.id);
      const result = await reservationService.getMemberReservations(memberId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = getReservationsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { status, memberId, collectionId, limit, offset } = validation.data;
      const result = await reservationService.getAllReservations({
        status: status as "waiting" | "fulfilled" | "canceled" | undefined,
        memberId,
        collectionId,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReservationController();
