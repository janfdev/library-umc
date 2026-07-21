import { Router } from "express";
import { bibliographyController } from "../controller/bibliography.controller";
import { isAuthenticated } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";

const router = Router();

router.get("/bibliographies/check-duplicate", publicApiLimiter, (req, res, next) => bibliographyController.checkDuplicate(req, res, next));
router.get("/bibliographies", publicApiLimiter, (req, res, next) => bibliographyController.list(req, res, next));
router.get("/bibliographies/:id", publicApiLimiter, (req, res, next) => bibliographyController.getById(req, res, next));
router.get("/bibliographies/:id/items", publicApiLimiter, (req, res, next) => bibliographyController.getItems(req, res, next));
router.post("/bibliographies", publicApiLimiter, isAuthenticated, requireRole(["super_admin", "staff"]), (req, res, next) => bibliographyController.create(req, res, next));
router.patch("/bibliographies/:id", publicApiLimiter, isAuthenticated, requireRole(["super_admin", "staff"]), (req, res, next) => bibliographyController.update(req, res, next));
router.delete("/bibliographies/:id", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => bibliographyController.softDelete(req, res, next));

export default router;
