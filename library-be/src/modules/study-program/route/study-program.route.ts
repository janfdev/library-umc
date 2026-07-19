import { Router } from "express";
import { StudyProgramController } from "../controller/study-program.controller";
import { isAuthenticated, requireRole } from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";

const router = Router();
const studyProgramController = new StudyProgramController();

/**
 * @swagger
 * /study-programs:
 *   get:
 *     summary: Get all study programs
 *     description: Retrieve list of all study programs. Optional ?facultyId filter.
 *     tags: [Study Programs]
 *     parameters:
 *       - in: query
 *         name: facultyId
 *         schema:
 *           type: integer
 *         description: Filter by faculty ID
 *     responses:
 *       200:
 *         description: Study programs retrieved successfully
 */
router.get("/study-programs", publicApiLimiter, (req, res, next) => studyProgramController.getAll(req, res, next));

/**
 * @swagger
 * /study-programs/{id}:
 *   get:
 *     summary: Get study program by ID
 *     tags: [Study Programs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study program retrieved
 *       404:
 *         description: Not found
 */
router.get("/study-programs/:id", publicApiLimiter, (req, res, next) => studyProgramController.getById(req, res, next));

/**
 * @swagger
 * /study-programs:
 *   post:
 *     summary: Create new study program
 *     tags: [Study Programs]
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
 *               - facultyId
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               facultyId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Study program created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate name in faculty
 */
router.post("/study-programs", isAuthenticated, requireRole(["super_admin"]), (req, res, next) => studyProgramController.create(req, res, next));

/**
 * @swagger
 * /study-programs/{id}:
 *   patch:
 *     summary: Update study program
 *     tags: [Study Programs]
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
 *               facultyId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Study program updated
 *       404:
 *         description: Not found
 *       409:
 *         description: Duplicate name in faculty
 */
router.patch("/study-programs/:id", isAuthenticated, requireRole(["super_admin"]), (req, res, next) => studyProgramController.update(req, res, next));

/**
 * @swagger
 * /study-programs/{id}:
 *   delete:
 *     summary: Delete study program
 *     tags: [Study Programs]
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
 *         description: Study program deleted
 *       404:
 *         description: Not found
 *       409:
 *         description: Cannot delete - in use
 */
router.delete("/study-programs/:id", isAuthenticated, requireRole(["super_admin"]), (req, res, next) => studyProgramController.delete(req, res, next));

export const studyProgramRoutes = router;
