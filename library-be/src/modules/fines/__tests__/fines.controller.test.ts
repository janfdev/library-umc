import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ============================================================
// SETUP: Express App Palsu untuk Controller Testing
// ============================================================
const app = express();
app.use(express.json());

// Mock finesService sebelum controller diimport
vi.mock('../service/fines.service', () => ({
  default: {
    getAllFines:       vi.fn(),
    getFineById:      vi.fn(),
    createFineManual: vi.fn(),
    payFine:          vi.fn(),
    deleteFine:       vi.fn(),
  },
}));

import finesController from '../controller/fines.controller';
import finesService from '../service/fines.service';

// Routes palsu — bypass middleware auth
app.get('/fines', (req, res, next) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  finesController.getAllFines(req, res, next);
});

app.get('/fines/:id', (req, res, next) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  finesController.getFineById(req, res, next);
});

app.post('/fines', (req, res, next) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  finesController.createFineManual(req, res, next);
});

app.post('/fines/:id/pay', (req, res, next) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  finesController.payFine(req, res, next);
});

app.delete('/fines/:id', (req, res, next) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  finesController.deleteFine(req, res, next);
});

// ============================================================
// TEST SUITE
// ============================================================
describe('FinesController Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================
  // GET /fines
  // ==========================================================
  describe('GET /fines', () => {
    // 🔴 RED: Query parameter status tidak valid
    it('harus return 400 jika status query param bukan "paid" atau "unpaid"', async () => {
      const response = await request(app)
        .get('/fines?status=invalid-status');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });

    // 🟢 GREEN: Berhasil ambil semua denda unpaid
    it('harus return 200 dengan list denda ketika request valid', async () => {
      const mockFines = [
        { id: 'fine-1', amount: 2500, status: 'unpaid', loan: { member: { user: { name: 'Budi' } } } },
        { id: 'fine-2', amount: 1000, status: 'unpaid', loan: { member: { user: { name: 'Siti' } } } },
      ];

      vi.spyOn(finesService, 'getAllFines').mockResolvedValueOnce({
        success: true,
        message: 'Fines fetched successfully',
        data: mockFines as any,
      });

      const response = await request(app)
        .get('/fines?status=unpaid');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    // 🟢 GREEN: Tanpa filter status — ambil semua denda
    it('harus return 200 dengan semua denda tanpa filter status', async () => {
      vi.spyOn(finesService, 'getAllFines').mockResolvedValueOnce({
        success: true,
        message: 'Fines fetched successfully',
        data: [],
      });

      const response = await request(app).get('/fines');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==========================================================
  // GET /fines/:id
  // ==========================================================
  describe('GET /fines/:id', () => {
    // 🔴 RED: Fine tidak ditemukan
    it('harus forward error ke next() ketika fine tidak ditemukan', async () => {
      vi.spyOn(finesService, 'getFineById').mockRejectedValueOnce(
        new Error('Fine not found')
      );

      const response = await request(app)
        .get('/fines/fine-tidak-ada');

      // Error handler default Express akan return 500
      expect(response.status).toBe(500);
    });

    // 🟢 GREEN: Berhasil ambil detail fine
    it('harus return 200 dengan detail denda jika fineId valid', async () => {
      const mockFine = {
        id: 'fine-1',
        amount: 2500,
        status: 'unpaid',
        loanId: 'loan-1',
        loan: {
          dueDate: '2026-03-01',
          member: { user: { name: 'Budi', email: 'budi@mail.com' } },
          item: { collection: { title: 'Laskar Pelangi' } },
        },
        transaction: null,
      };

      vi.spyOn(finesService, 'getFineById').mockResolvedValueOnce({
        success: true,
        message: 'Fine fetched successfully',
        data: mockFine as any,
      });

      const response = await request(app).get('/fines/fine-1');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('fine-1');
      expect(response.body.data.amount).toBe(2500);
    });
  });

  // ==========================================================
  // POST /fines (createFineManual)
  // ==========================================================
  describe('POST /fines (createFineManual)', () => {
    // 🔴 RED: Body tidak valid — loanId kosong
    it('harus return 400 jika body tidak mengandung loanId', async () => {
      const response = await request(app)
        .post('/fines')
        .send({ amount: 1000 }); // loanId hilang

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });

    // 🔴 RED: Body tidak valid — amount tidak ada
    it('harus return 400 jika amount tidak disertakan', async () => {
      const response = await request(app)
        .post('/fines')
        .send({ loanId: 'loan-1' }); // amount hilang

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });

    // 🟢 GREEN: Berhasil buat denda manual
    it('harus return 201 ketika denda manual berhasil dibuat', async () => {
      const mockFine = { id: 'fine-new', loanId: 'loan-1', amount: '2500', status: 'unpaid' };

      vi.spyOn(finesService, 'createFineManual').mockResolvedValueOnce({
        success: true,
        message: 'Fine created successfully',
        data: mockFine as any,
      });

      const response = await request(app)
        .post('/fines')
        .send({ loanId: 'loan-1', amount: 2500 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('2500');
    });
  });

  // ==========================================================
  // POST /fines/:id/pay — ⭐ KRITIS: alur pembayaran
  // ==========================================================
  describe('POST /fines/:id/pay', () => {
    // 🔴 RED: Body tidak ada paymentMethod (string kosong ditolak oleh .min(1))
    it('harus return 400 jika paymentMethod kosong (string kosong)', async () => {
      const response = await request(app)
        .post('/fines/fine-1/pay')
        .send({ paymentMethod: '' }); // string kosong tidak memenuhi min(1)

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });

    // 🔴 RED: Body tidak ada field paymentMethod sama sekali
    it('harus return 400 jika paymentMethod tidak disertakan', async () => {
      const response = await request(app)
        .post('/fines/fine-1/pay')
        .send({}); // tidak ada paymentMethod

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });

    // 🟢 GREEN: Pembayaran cash berhasil
    it('⭐ harus return 200 ketika pembayaran denda berhasil dengan metode cash', async () => {
      const mockResult = {
        success: true,
        message: 'Fine paid successfully',
        data: {
          fine: { id: 'fine-1', status: 'paid', amount: '2500' },
          transaction: { id: 'tx-1', fineId: 'fine-1', paymentMethod: 'cash' },
        },
      };

      vi.spyOn(finesService, 'payFine').mockResolvedValueOnce(mockResult as any);

      const response = await request(app)
        .post('/fines/fine-1/pay')
        .send({ paymentMethod: 'cash' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fine.status).toBe('paid');
      expect(response.body.data.transaction.paymentMethod).toBe('cash');
    });

    // 🟢 GREEN: Pembayaran transfer berhasil
    it('harus return 200 ketika pembayaran denda berhasil dengan metode transfer', async () => {
      const mockResult = {
        success: true,
        message: 'Fine paid successfully',
        data: {
          fine: { id: 'fine-2', status: 'paid', amount: '1000' },
          transaction: { id: 'tx-2', fineId: 'fine-2', paymentMethod: 'transfer' },
        },
      };

      vi.spyOn(finesService, 'payFine').mockResolvedValueOnce(mockResult as any);

      const response = await request(app)
        .post('/fines/fine-2/pay')
        .send({ paymentMethod: 'transfer' });

      expect(response.status).toBe(200);
      expect(response.body.data.transaction.paymentMethod).toBe('transfer');
    });
  });

  // ==========================================================
  // DELETE /fines/:id
  // ==========================================================
  describe('DELETE /fines/:id', () => {
    // 🔴 RED: Fine tidak ditemukan → service throw error
    it('harus forward error ke next() ketika fine yang dihapus tidak ditemukan', async () => {
      vi.spyOn(finesService, 'deleteFine').mockRejectedValueOnce(
        new Error('Fine not found')
      );

      const response = await request(app)
        .delete('/fines/fine-tidak-ada');

      expect(response.status).toBe(500);
    });

    // 🟢 GREEN: Soft delete berhasil
    it('harus return 200 ketika denda berhasil dihapus (soft delete)', async () => {
      vi.spyOn(finesService, 'deleteFine').mockResolvedValueOnce({
        success: true,
        message: 'Fine deleted successfully',
        data: null,
      });

      const response = await request(app)
        .delete('/fines/fine-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });
});
