import { Router } from "express";
import { isAuthenticated, requireRole } from "../middlewares/auth.middleware";
import { publicApiLimiter } from "../middlewares/rateLimiter";
import auditController from "../controller/AuditController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: System-wide audit logging API
 */

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Get all audit logs (Admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Action filter (create, update, delete, approve, blacklist)
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Entity filter (loan, item, fine, Users)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// Admin: Get all logs
router.get(
  "/logs",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  auditController.getLogs.bind(auditController),
);

export const auditRoutes = router;
