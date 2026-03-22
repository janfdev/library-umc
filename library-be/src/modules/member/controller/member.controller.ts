import { type Request, type Response } from "express";
import { MemberService } from "../service/member.service";
import { updateProfileSchema } from "../validation/member.validation";

const memberService = new MemberService();

export class MemberController {
  /**
   * Get Profile milik user yang sedang login (Me)
   */
  async getMyProfile(req: Request, res: Response) {
    try {
      // SECURITY: Ambil userId dari session, bukan dari params
      const sessionUser = req.user;

      if (!sessionUser || !sessionUser.id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          data: null,
        });
        return;
      }

      const userId = sessionUser.id;

      const result = await memberService.getMemberByUserId(userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("[MemberController] Error getting profile:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * Update Profile milik user yang sedang login (Me)
   */
  async updateMyProfile(req: Request, res: Response) {
    try {
      // Validasi Input Body
      const validation = updateProfileSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      //  Ambil userId dari session
      const sessionUser = req.user;

      if (!sessionUser || !sessionUser.id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          data: null,
        });
        return;
      }

      const userId = sessionUser.id;

      const result = await memberService.updateProfile(userId, validation.data);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("[MemberController] Error Updating Profile", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }
}
