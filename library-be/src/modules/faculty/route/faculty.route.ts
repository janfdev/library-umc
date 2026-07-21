import { Router } from "express";
import { FacultyController } from "../controller/faculty.controller";
import { isAuthenticated, requireRole } from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";

const router = Router();
const facultyController = new FacultyController();

/**
 * @swagger
 * /faculties:
 *   get:
 *     summary: Get all faculties
 *     description: Retrieve list of all faculties (Public endpoint)
 *     tags: [Faculties]
 *     responses:
 *       200:
 *         description: Faculties retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/faculties", publicApiLimiter, (req, res, next) => facultyController.getAll(req, res, next));

/**
 * @swagger
 * /faculties/{id}:
 *   get:
 *     summary: Get faculty by ID
 *     description: Retrieve a single faculty by its ID
 *     tags: [Faculties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Faculty retrieved successfully
 *       404:
 *         description: Faculty not found
 */
router.get("/faculties/:id", publicApiLimiter, (req, res, next) => facultyController.getById(req, res, next));

/**
 * @swagger
 * /faculties:
 *   post:
 *     summary: Create new faculty
 *     description: Add a new faculty (Super Admin only)
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Fakultas Teknik
 *               code:
 *                 type: string
 *                 example: FT
 *     responses:
 *       201:
 *         description: Faculty created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Faculty with this name already exists
 */
router.post("/faculties", isAuthenticated, requireRole(["super_admin"]), (req, res, next) => facultyController.create(req, res, next));

/**
 * @swagger
 * /faculties/{id}:
 *   patch:
 *     summary: Update faculty
 *     description: Update an existing faculty (Super Admin only)
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Faculty updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Faculty not found
 *       409:
 *         description: Faculty with this name already exists
 */
router.patch("/faculties/:id", isAuthenticated, requireRole(["super_admin"]), (req, res, next) => facultyController.update(req, res, next));

/**
 * @swagger
 * /faculties/{id}:
 *   delete:
 *     summary: Delete faculty
 *     description: Soft delete a faculty (Super Admin only). Cannot delete if used by study programs or bibliographies.
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Faculty deleted
 *       404:
 *         description: Faculty not found
 *       409:
 *         description: Cannot delete - faculty is in use
 */
router.delete("/faculties/:id", isAuthenticated, requireRole(["super_admin"]), (req, res, next) => facultyController.delete(req, res, next));

export const facultyRoutes = router;
