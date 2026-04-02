import { Router } from "express";
import { isAuthenticated } from "../../../middlewares/auth.middleware";
import { MemberController } from "../controller/member.controller";

const router = Router();
const memberController = new MemberController();

/**
 * @swagger
 * /members/me:
 *   get:
 *     summary: Get Current Member Profile
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member profile data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Member'
 *       404:
 *         description: Member profile not found
 */
router.get("/members/me", isAuthenticated, memberController.getMyProfile);

/**
 * @swagger
 * /members/me:
 *   patch:
 *     summary: Update Current Member Profile
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nimNidn:
 *                 type: string
 *               faculty:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 */
router.patch("/members/me", isAuthenticated, memberController.updateMyProfile);
export const memberRoutes = router;
