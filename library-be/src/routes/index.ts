import { Router } from "express";
import { authRoutes } from "./auth.route";
import { memberRoutes } from "./member.route";
import { collectionRoutes } from "./collection.route";
import { categoryRoutes } from "./category.route";
import { guestRoutes } from "./guest.route";
import { loanRoutes } from "./loan.route";
import { itemRoutes } from "./item.route";
import { notificationRoutes } from "./notification.route";
import { reservationRoutes } from "./reservation.route";
import finesRoutes from "./fines.route";
import { recommendationRoutes } from "./recommendations.route";
import { auditRoutes } from "./audit.route";
import { reportRoutes } from "./report.route";

const router = Router();

// Auth & Users
router.use(authRoutes);

// Member
router.use(memberRoutes);

// Collections
router.use(collectionRoutes);

// Categories
router.use(categoryRoutes);

// Items (Physical Copies)
router.use(itemRoutes);

// Guests
router.use(guestRoutes);

// Loans
router.use(loanRoutes);

// Notification
router.use(notificationRoutes);

// Reservations
router.use(reservationRoutes);

// Fines
router.use(finesRoutes);

// Recommendations
router.use(recommendationRoutes);

// Audit
router.use(auditRoutes);

// Reports & Export
router.use(reportRoutes);

export const routes = router;
