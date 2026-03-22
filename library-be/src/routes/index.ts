import { Router } from "express";
import { authRoutes } from "../modules/auth/route/auth.route";
import { memberRoutes } from "../modules/member/route/member.route";
import { collectionRoutes } from "../modules/collection/route/collection.route";
import { categoryRoutes } from "../modules/category/route/category.route";
import { guestRoutes } from "../modules/guest/route/guest.route";
import { loanRoutes } from "../modules/loan/route/loan.route";
import { itemRoutes } from "../modules/item/route/item.route";
import { notificationRoutes } from "../modules/notification/route/notification.route";
import { reservationRoutes } from "../modules/reservation/route/reservation.route";
import finesRoutes from "../modules/fines/route/fines.route";
import { recommendationRoutes } from "../modules/recommendation/route/recommendations.route";
import { auditRoutes } from "../modules/audit/route/audit.route";
import { reportRoutes } from "../modules/report/route/report.route";
import { locationRoutes } from "../modules/location/route/location.route";

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

// Locations (Rak & Ruangan)
router.use(locationRoutes);

export const routes = router;
