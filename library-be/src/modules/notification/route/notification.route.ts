import { Router } from "express";
import {
  sendFinesNotification,
  sendLoansNotification,
} from "../controller/notification.controller";
import {
  isAuthenticated,
  requireRole,
} from "../../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /notification/send-fines:
 *   post:
 *     summary: Send fine notification email
 *     description: Send an email to member about their fines (Staff/Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - amount
 *               - bookTitle
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               bookTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fine notification sent successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff/Admin only
 */
router.post(
  "/notification/send-fines",
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  sendFinesNotification,
);

/**
 * @swagger
 * /notification/send-loans:
 *   post:
 *     summary: Send loan notification email
 *     description: Send an email to member about their loans/reminders (Staff/Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - bookTitle
 *               - tanggalPengembalian
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               bookTitle:
 *                 type: string
 *               tanggalPengembalian:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Loan notification sent successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff/Admin only
 */
router.post(
  "/notification/send-loans",
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  sendLoansNotification,
);

export const notificationRoutes = router;
