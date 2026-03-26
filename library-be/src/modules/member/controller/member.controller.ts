import { type NextFunction, type Request, type Response } from "express";
import { MemberService } from "../service/member.service";
import { updateProfileSchema } from "../validation/member.validation";
import {
  sendSuccess,
  sendError,
  sendValidationError,
} from "../../../utils/api-utils";

const memberService = new MemberService();

export class MemberController {
  /**
   * GET /me — Ambil profil user yang sedang login
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return sendError(res, "Tidak terautentikasi", 401);
      }

      const result = await memberService.getMemberByUserId(req.user.id);

      if (!result.success) {
        return sendError(res, result.message ?? "Data tidak ditemukan", 404);
      }

      sendSuccess(res, "Profil berhasil diambil", result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /me — Update profil user yang sedang login
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      if (!req.user?.id) {
        return sendError(res, "Tidak terautentikasi", 401);
      }

      const result = await memberService.updateProfile(req.user.id, validation.data);

      if (!result.success) {
        return sendError(res, result.message ?? "Gagal memperbarui profil", 400);
      }

      sendSuccess(res, "Profil berhasil diperbarui", result.data);
    } catch (error) {
      next(error);
    }
  }
}
