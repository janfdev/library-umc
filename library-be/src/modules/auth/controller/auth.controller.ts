import { type NextFunction, type Request, type Response } from "express";
import { AuthService } from "../service/auth.service";
import {
  loginSchema,
  registerSchema,
  loginCredentialSchema,
} from "../validation/auth.validation";
import { UserService } from "../service/user.service";
import {
  sendSuccess,
  sendError,
  sendValidationError,
} from "../../../utils/api-utils";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { name, email, password } = validation.data;
      const result = await authService.registerWithCredentials(name, email, password);

      sendSuccess(res, "Registrasi berhasil", result, 201);
    } catch (error) {
      next(error);
    }
  }

  async loginCredential(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = loginCredentialSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { email, password } = validation.data;
      const result = await authService.loginWithCredentials(email, password);

      sendSuccess(res, "Login berhasil", result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { email } = validation.data;
      const result = await authService.verifyWithCampus(email);

      if (!result.campusData) {
        return sendError(res, "Email tidak ditemukan di sistem kampus", 404);
      }

      sendSuccess(res, "Verifikasi kampus berhasil", result);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getAllUsers();

      if (!result.success) {
        return sendError(res, result.message ?? "Gagal mengambil data pengguna", 500);
      }

      sendSuccess(res, "Data pengguna berhasil diambil", result.data);
    } catch (error) {
      next(error);
    }
  }
}
