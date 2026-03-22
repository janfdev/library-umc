import { type Request, type Response, type NextFunction } from "express";
import reservationService from "../service/reservation.service";
import { MemberService } from "../../member/service/member.service";
import { BadRequestError } from "../../../exceptions/AppError";
import { 
  createReservationSchema, 
  getReservationsQuerySchema 
} from "../validation/reservation.validation";

const memberService = new MemberService();

export class ReservationController {
  // Helper to get member ID robustly
  private async getMemberId(userId: string): Promise<string> {
    const memberRes = await memberService.getMemberByUserId(userId);
    if (!memberRes.success || !memberRes.data) {
      throw new BadRequestError(
        "Profil member tidak ditemukan. Silakan lengkapi profil Anda terlebih dahulu.",
      );
    }
    return memberRes.data.id;
  }

  // 1. Create Reservation
  async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const validation = createReservationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
      }

      const { collectionId } = validation.data;

      const memberId = await this.getMemberId(userId);
      const result = await reservationService.createReservation(
        memberId,
        collectionId,
      );

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 2. Cancel Reservation (PATCH — soft cancel, bukan delete)
  async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const memberId = await this.getMemberId(userId);
      const result = await reservationService.cancelReservation(
        id as string,
        memberId,
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 3. Get My Reservations (Member)
  async getMyReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const memberId = await this.getMemberId(userId);
      const result = await reservationService.getMemberReservations(memberId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 4. Get All Reservations (Admin Only)
  async getAllReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = getReservationsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
      }

      const { status, memberId, collectionId, limit, offset } = validation.data;

      const result = await reservationService.getAllReservations({
        status: status as "waiting" | "fulfilled" | "canceled" | undefined,
        memberId,
        collectionId,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReservationController();
