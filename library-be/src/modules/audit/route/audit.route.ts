import { Router } from "express";
import {
  isAuthenticated,
  requireRole,
} from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";
import auditController from "../controller/audit.controller";

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
 *         description: Entity filter (loan, item, fine, Users, category, collection, reservation)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Jumlah log yang dikembalikan
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset untuk paginasi
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - bukan super_admin atau staff
 */
router.get(
  "/logs",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin"]),
  auditController.getLogs.bind(auditController),
);

export const auditRoutes = router;
