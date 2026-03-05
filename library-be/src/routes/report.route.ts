import { Router } from "express";
import { isAuthenticated, requireRole } from "../middlewares/auth.middleware";
import { publicApiLimiter } from "../middlewares/rateLimiter";
import reportController from "../controller/ReportController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Dashboard statistics and export endpoints (Admin/Staff only)
 */

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats including totalCollections, totalItems, activeLoans, overdueLoans, totalMembers, unpaidFinesTotal, waitingReservations
 */
router.get(
  "/reports/dashboard",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  reportController.getDashboardStats.bind(reportController),
);

/**
 * @swagger
 * /reports/popular-books:
 *   get:
 *     summary: Get top most borrowed books
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of books to return
 *     responses:
 *       200:
 *         description: List of popular books with loan count
 */
router.get(
  "/reports/popular-books",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  reportController.getPopularBooks.bind(reportController),
);

/**
 * @swagger
 * /reports/guest-stats:
 *   get:
 *     summary: Get guest visit statistics for last 7 days
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily visitor counts for the last 7 days
 */
router.get(
  "/reports/guest-stats",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  reportController.getGuestStats.bind(reportController),
);

/**
 * @swagger
 * /reports/loans/export:
 *   get:
 *     summary: Export loan report as CSV or PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [approved, pending, returned, rejected]
 *         description: Filter by loan status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: File download (CSV or PDF)
 */
router.get(
  "/reports/loans/export",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  reportController.exportLoans.bind(reportController),
);

/**
 * @swagger
 * /reports/fines/export:
 *   get:
 *     summary: Export fines report as CSV or PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, unpaid]
 *         description: Filter by fine status
 *     responses:
 *       200:
 *         description: File download (CSV or PDF)
 */
router.get(
  "/reports/fines/export",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  reportController.exportFines.bind(reportController),
);

export const reportRoutes = router;
