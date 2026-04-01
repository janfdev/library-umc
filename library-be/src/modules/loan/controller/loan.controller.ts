import { type NextFunction, type Request, type Response } from "express";
import { LoanService } from "../service/loan.service";
import {
  createLoanSchema,
  getLoansQuerySchema
} from "../validation/loan.validation";
import {
  sendSuccess,
  sendError,
  sendValidationError
} from "../../../utils/api-utils";
import { MemberService } from "../../member/service/member.service";

const loanService = new LoanService();
const memberService = new MemberService();

export class LoanController {
  /**
   * POST /loans/request — Ajukan permintaan peminjaman (Member)
   */
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createLoanSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      if (!req.user?.id) {
        return sendError(res, "Tidak terautentikasi", 401);
      }

      const eligibility = await memberService.getBorrowEligibilityByUserId(
        req.user.id
      );
      if (!eligibility.success || !eligibility.data?.memberId) {
        return sendError(res, eligibility.message, 400);
      }

      const result = await loanService.requestLoan(
        eligibility.data.memberId,
        validation.data.collectionId,
        validation.data.loanDate,
        validation.data.dueDate
      );
      sendSuccess(res, "Permintaan peminjaman berhasil diajukan", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /loans/verify/:token — Verifikasi token QR peminjaman
   */
  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        return sendError(res, "Token wajib diisi", 400);
      }

      const result = await loanService.verifyToken(token as string);
      sendSuccess(res, "Token berhasil diverifikasi", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /loans/approve/:requestId — Approve peminjaman (Admin/Staff)
   */
  async approveLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user || (user.role !== "super_admin" && user.role !== "staff")) {
        return sendError(res, "Akses ditolak — hanya Admin/Staff", 403);
      }

      const result = await loanService.approveLoan(
        String(req.params.requestId),
        user.id
      );
      sendSuccess(res, "Peminjaman berhasil diapprove", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /loans/reject/:requestId — Tolak peminjaman (Admin/Staff)
   */
  async rejectLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user || (user.role !== "super_admin" && user.role !== "staff")) {
        return sendError(res, "Akses ditolak — hanya Admin/Staff", 403);
      }

      const result = await loanService.rejectLoan(
        String(req.params.requestId),
        user.id
      );
      sendSuccess(res, "Peminjaman berhasil ditolak", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /loans/return/:loanId — Proses pengembalian buku (Admin/Staff)
   */
  async returnLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user || (user.role !== "super_admin" && user.role !== "staff")) {
        return sendError(res, "Akses ditolak — hanya Admin/Staff", 403);
      }

      const result = await loanService.returnLoan(
        String(req.params.loanId),
        user.id
      );
      sendSuccess(res, "Buku berhasil dikembalikan", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /loans/my — Ambil peminjaman milik member yang login
   */
  async getMyLoans(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return sendError(res, "Tidak terautentikasi", 401);
      }

      const memberId = await loanService.getMemberIdByUserId(req.user.id);
      if (!memberId) {
        return sendError(res, "Profil member tidak ditemukan", 400);
      }

      const result = await loanService.getAllLoans({ memberId, limit: 100 });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /loans — Ambil semua peminjaman (Admin/Staff)
   */
  async getAllLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user || (user.role !== "super_admin" && user.role !== "staff")) {
        return sendError(res, "Akses ditolak — hanya Admin/Staff", 403);
      }

      const validation = getLoansQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { status, memberId } = validation.data;

      const result = await loanService.getAllLoans({
        status: status as any,
        memberId,
        limit: 100
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /loans/:loanId/extend — Perpanjang peminjaman (Member)
   */
  async extendLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanId } = req.params;

      if (!req.user?.id) {
        return sendError(res, "Tidak terautentikasi", 401);
      }

      const memberId = await loanService.getMemberIdByUserId(req.user.id);
      if (!memberId) {
        return sendError(res, "Profil member tidak ditemukan", 400);
      }

      const result = await loanService.extendLoan(String(loanId), memberId);
      sendSuccess(res, result.message, result.data);
    } catch (error: unknown) {
      const err = error as Error;
      // Jika error message kita kenali, kirim sebagai 400
      if (
        err.message &&
        (err.message.includes("sudah pernah diperpanjang") ||
          err.message.includes("melewati batas waktu") ||
          err.message.includes("dipesan (reserved)"))
      ) {
        return sendError(res, err.message, 400);
      }
      next(error);
    }
  }
}
