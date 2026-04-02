import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { UnauthorizedError } from "../../../exceptions/AppError";
import { AuthController } from "../controller/auth.controller";
import { AuthService } from "../service/auth.service";
import auditService from "../../audit/service/audit.service";

vi.mock("../../audit/service/audit.service", () => ({
  default: {
    createLog: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("AuthController Audit Logging", () => {
  const app = express();
  const authController = new AuthController();

  app.use(express.json());
  app.post("/login", (req, res, next) =>
    authController.loginCredential(req, res, next),
  );

  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const statusCode =
        typeof err?.statusCode === "number" ? err.statusCode : 500;
      return res.status(statusCode).json({
        success: false,
        message: err?.message || "Internal Server Error",
      });
    },
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mencatat audit failed_login saat validasi login gagal", async () => {
    const response = await request(app).post("/login").send({
      email: "email-tidak-valid",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(auditService.createLog).toHaveBeenCalledTimes(1);
    expect(auditService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "failed_login",
        entity: "auth",
      }),
    );
  });

  it("mencatat audit invalid_credentials saat login ditolak service", async () => {
    vi.spyOn(
      AuthService.prototype,
      "loginWithCredentials",
    ).mockRejectedValueOnce(new UnauthorizedError("Email atau password salah"));

    const response = await request(app).post("/login").send({
      email: "test@example.com",
      password: "password-salah",
    });

    expect(response.status).toBe(401);
    expect(auditService.createLog).toHaveBeenCalledTimes(1);
    expect(auditService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "failed_login",
        entity: "auth",
        detail: expect.stringContaining("invalid_credentials"),
      }),
    );
  });
});
