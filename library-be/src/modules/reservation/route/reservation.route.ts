import { Router } from "express";
import reservationController from "../controller/reservation.controller";
import {
  isAuthenticated,
  requireRole,
} from "../../../middlewares/auth.middleware";
import { publicApiLimiter } from "../../../middlewares/rateLimiter";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: API endpoints for managing book reservations (antri buku)
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Buat reservasi buku (Member)
 *     description: |
 *       Member dapat reservasi buku hanya jika **semua eksemplar sedang dipinjam**.
 *       Jika masih ada item berstatus `available`, request akan ditolak dengan pesan
 *       "Masih ada eksemplar yang tersedia, silakan pinjam langsung."
 *       Limit maksimal 3 reservasi aktif per member.
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bibliographyId
 *             properties:
 *               bibliographyId:
 *                 type: string
 *                 format: uuid
 *                 description: ID bibliografi (judul buku) yang ingin direservasi
 *     responses:
 *       201:
 *         description: Reservasi berhasil dibuat, status = waiting
 *       400:
 *         description: Bad request (masih ada item available / sudah reservasi / limit tercapai)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Koleksi tidak ditemukan
 */
router.post(
  "/reservations",
  publicApiLimiter,
  isAuthenticated,
  reservationController.createReservation.bind(reservationController),
);

/**
 * @swagger
 * /reservations/my:
 *   get:
 *     summary: Lihat riwayat reservasi saya (Member)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar reservasi member (semua status)
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/reservations/my",
  publicApiLimiter,
  isAuthenticated,
  reservationController.getMyReservations.bind(reservationController),
);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   patch:
 *     summary: Batalkan reservasi (Member)
 *     description: |
 *       Member dapat membatalkan reservasisnya sendiri selama statusnya masih `waiting`.
 *       Reservasi yang sudah `fulfilled` atau `canceled` tidak bisa dibatalkan lagi.
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservasi berhasil dibatalkan, status = canceled
 *       400:
 *         description: Reservasi tidak bisa dibatalkan (sudah fulfilled/canceled)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservasi tidak ditemukan
 */
router.patch(
  "/reservations/:id/cancel",
  publicApiLimiter,
  isAuthenticated,
  reservationController.cancelReservation.bind(reservationController),
);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Lihat semua reservasi (Admin/Staff)
 *     description: |
 *       **Catatan:** Fulfill reservasi terjadi OTOMATIS saat admin proses pengembalian buku
 *       (`POST /loans/:id/return`). Tidak ada endpoint manual untuk fulfill.
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, fulfilled, canceled]
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bibliographyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Daftar semua reservasi
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (butuh role admin/staff)
 */
router.get(
  "/reservations",
  publicApiLimiter,
  isAuthenticated,
  requireRole(["super_admin", "staff"]),
  reservationController.getAllReservations.bind(reservationController),
);

export const reservationRoutes = router;
