import { Router } from "express";
import { ItemController } from "../controller/item.controller";
import {
  isAuthenticated,
  requireRole,
} from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";

const router = Router();
const itemController = new ItemController();

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     description: Retrieve all physical book items (copies). Can filter by collectionId.
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: collectionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter items by Collection ID
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/items", publicApiLimiter, itemController.getAllItems);

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve single item details
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *       404:
 *         description: Item not found
 */
router.get("/items/:id", publicApiLimiter, itemController.getItemById);

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create new item
 *     description: Add a new physical copy/item of a book (Admin/Staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collectionId
 *               - locationId
 *               - barcode
 *             properties:
 *               collectionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the parent collection (book title)
 *               locationId:
 *                 type: integer
 *               barcode:
 *                 type: string
 *               uniqueCode:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, loaned, damaged, lost]
 *                 default: available
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Validation error or duplicate barcode
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.post(
  "/items",
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  itemController.createItem,
);

/**
 * @swagger
 * /items/{id}:
 *   patch:
 *     summary: Update item
 *     description: Update item details (Admin/Staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionId:
 *                 type: string
 *                 format: uuid
 *               locationId:
 *                 type: integer
 *               barcode:
 *                 type: string
 *               uniqueCode:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, loaned, damaged, lost]
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Validation error or duplicate barcode
 *       404:
 *         description: Item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.patch(
  "/items/:id",
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  itemController.updateItem,
);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete item
 *     description: Remove a physical item (Admin/Staff only). Cannot delete if currently loaned.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       400:
 *         description: Cannot delete (e.g. loaned)
 *       404:
 *         description: Item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.delete(
  "/items/:id",
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  itemController.deleteItem,
);

export const itemRoutes = router;
