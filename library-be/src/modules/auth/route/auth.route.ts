import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import {
  isAuthenticated,
  requireRole,
} from "../../../middlewares/auth.middleware";
import { authLimiter } from "../../../middlewares/rateLimiter";

const router = Router();
const authController = new AuthController();

// Frontend kini memanggil via authClient:
//   - authClient.signUp.email()  → POST /api/auth/sign-up/email
//   - authClient.signIn.email()  → POST /api/auth/sign-in/email
//   - authClient.signIn.social() → POST /api/auth/sign-in/social
//
// Semua route /api/auth/* HARUS ditangani better-auth, bukan
// custom controller — agar cookie session di-set otomatis.
// ============================================================
// router.post("/auth/register", authController.register);
// router.post("/auth/login", authController.loginCredential);
// router.post("/auth/google-callback", authController.login);   ← konflik wildcard

/**
 * @swagger
 * /campus/verify:
 *   post:
 *     summary: Verifikasi email via API Kampus UMC
 *     description: |
 *       Mengecek apakah email terdaftar di sistem kampus UMC.
 *       Dipisahkan dari prefix `/auth/*` agar tidak di-intercept
 *       oleh better-auth wildcard handler `app.all("/api/auth/*path")`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@umc.ac.id"
 *     responses:
 *       200:
 *         description: Verifikasi berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verifikasi kampus berhasil"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation Error
 *       404:
 *         description: Email tidak ditemukan di sistem kampus
 *       500:
 *         description: Server Error
 */
router.post("/campus/verify", authLimiter, authController.login);

/**
 * @swagger
 * /users/all:
 *   get:
 *     summary: Get All Users (Super Admin Only)
 *     description: |
 *       Dipindahkan dari `/auth/users` agar tidak di-intercept
 *       oleh better-auth wildcard handler `app.all("/api/auth/*path")`.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.get(
  "/users/all",
  isAuthenticated,
  requireRole(["super_admin"]),
  authController.getAllUsers,
);

export const authRoutes = router;
