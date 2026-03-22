import { type NextFunction, type Request, type Response } from "express";
import { AuthService } from "../service/auth.service";
import {
  loginSchema,
  registerSchema,
  loginCredentialSchema,
} from "../validation/auth.validation";
import { UserService } from "../service/user.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = registerSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const { name, email, password } = validation.data;

      const result = await authService.registerWithCredentials(
        name,
        email,
        password,
      );

      res.status(201).json({
        success: true,
        message: "Registrasi berhasil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async loginCredential(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = loginCredentialSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const { email, password } = validation.data;

      const result = await authService.loginWithCredentials(email, password);

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          data: validation.error.flatten(),
        });
        return;
      }

      const { email } = validation.data;

      const result = await authService.verifyWithCampus(email);

      res.status(200).json({
        success: true,
        message: "User verified with Campus API",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getAllUsers();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
