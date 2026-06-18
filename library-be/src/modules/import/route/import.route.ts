import { Router } from "express";
import { isAuthenticated } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";
import { importController } from "../controller/import.controller";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// Bibliography import
router.post("/import/bibliographies/upload", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), upload.single("file"), (req, res, next) => importController.uploadBibliography(req, res, next));
router.post("/import/batches/:batchId/parse", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => importController.parseBatch(req, res, next));
router.get("/import/batches/:batchId/preview", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => importController.previewBatch(req, res, next));
router.post("/import/batches/:batchId/approve", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => importController.approveBatch(req, res, next));
router.get("/import/batches/:batchId/errors", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => importController.downloadErrors(req, res, next));
router.get("/import/batches", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => importController.listBatches(req, res, next));
router.get("/import/batches/:batchId", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), (req, res, next) => importController.getBatch(req, res, next));

// Item import
router.post("/import/items/upload", publicApiLimiter, isAuthenticated, requireRole(["super_admin"]), upload.single("file"), (req, res, next) => importController.uploadItem(req, res, next));

export default router;
