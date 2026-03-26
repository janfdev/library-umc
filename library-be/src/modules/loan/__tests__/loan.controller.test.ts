import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { LoanController } from '../controller/loan.controller';
import { LoanService } from '../service/loan.service';

// ============================================================
// SETUP: Express App Palsu untuk Controller Testing
// ============================================================
const app = express();
app.use(express.json());

const loanController = new LoanController();

// Route palsu — kita bypass middleware auth dengan menyuntikkan req.user secara manual
app.post('/loans/request', (req, res) => {
  (req as any).user = { id: 'user-student-1', role: 'student' };
  loanController.createRequest(req, res, {} as any);
});

app.post('/loans/:requestId/approve', (req, res) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  loanController.approveLoan(req, res, {} as any);
});

app.post('/loans/:requestId/reject', (req, res) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  loanController.rejectLoan(req, res, {} as any);
});

app.post('/loans/:loanId/return', (req, res) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  loanController.returnLoan(req, res, {} as any);
});

app.get('/loans', (req, res) => {
  (req as any).user = { id: 'admin-1', role: 'super_admin' };
  loanController.getAllLoans(req, res, {} as any);
});

// Route untuk simulasi request tanpa role admin (untuk test Forbidden)
app.post('/loans/:requestId/approve-noadmin', (req, res) => {
  (req as any).user = { id: 'student-1', role: 'student' }; // role salah!
  loanController.approveLoan(req, res, {} as any);
});

// ============================================================
// TEST SUITE
// ============================================================
describe('LoanController Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================
  // POST /loans/request
  // ==========================================================
  describe('POST /loans/request', () => {
    // 🔴 RED CASE: Validasi Zod gagal — itemId kosong
    it('harus return 400 jika body tidak mengandung itemId', async () => {
      const response = await request(app)
        .post('/loans/request')
        .send({}); // body kosong

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
      expect(response.body.data.fieldErrors).toHaveProperty('itemId');
    });

    // 🟢 GREEN CASE: Request berhasil
    it('harus return 200 ketika request pinjaman berhasil dibuat', async () => {
      const mockLoan = {
        id: 'loan-xyz', memberId: 'member-1', itemId: 'item-abc', status: 'pending',
      };

      // Mock getMemberIdByUserId agar mengembalikan memberId
      vi.spyOn(LoanService.prototype, 'getMemberIdByUserId')
        .mockResolvedValueOnce('member-1');

      // Mock requestLoan agar mengembalikan loan palsu
      vi.spyOn(LoanService.prototype, 'requestLoan')
        .mockResolvedValueOnce(mockLoan as any);

      const response = await request(app)
        .post('/loans/request')
        .send({ itemId: 'item-abc' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('pending');
    });

    // 🔴 RED CASE: Member profile belum dibuat (getMemberIdByUserId = undefined)
    it('harus return 400 jika member profile belum ditemukan', async () => {
      vi.spyOn(LoanService.prototype, 'getMemberIdByUserId')
        .mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/loans/request')
        .send({ itemId: 'item-abc' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Member profile not found');
    });
  });

  // ==========================================================
  // POST /loans/:requestId/approve
  // ==========================================================
  describe('POST /loans/:requestId/approve', () => {
    // 🔴 RED CASE: Role bukan admin
    it('harus return 403 jika user bukan super_admin atau staff', async () => {
      const response = await request(app)
        .post('/loans/loan-xyz/approve-noadmin');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin');
    });

    // 🟢 GREEN CASE: Approve berhasil oleh admin
    it('harus return 200 ketika admin berhasil menyetujui pinjaman', async () => {
      vi.spyOn(LoanService.prototype, 'approveLoan')
        .mockResolvedValueOnce({ message: 'Peminjaman berhasil disetujui, email notifikasi telah dikirim.' });

      const response = await request(app)
        .post('/loans/loan-xyz/approve');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('disetujui');
    });

    // 🔴 RED CASE: Pinjaman tidak ditemukan → service throw Error
    it('harus return 500 dengan pesan error jika pinjaman tidak ditemukan', async () => {
      vi.spyOn(LoanService.prototype, 'approveLoan')
        .mockRejectedValueOnce(new Error('Data peminjaman tidak ditemukan'));

      const response = await request(app)
        .post('/loans/loan-tidak-ada/approve');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Data peminjaman tidak ditemukan');
    });
  });

  // ==========================================================
  // POST /loans/:loanId/return
  // ==========================================================
  describe('POST /loans/:loanId/return', () => {
    // 🟢 GREEN CASE: Pengembalian tepat waktu
    it('harus return 200 dengan pesan tepat waktu jika tidak terlambat', async () => {
      vi.spyOn(LoanService.prototype, 'returnLoan')
        .mockResolvedValueOnce({
          success: true,
          message: 'Buku telah berhasil dikembalikan tepat waktu.',
        });

      const response = await request(app)
        .post('/loans/loan-xyz/return');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('tepat waktu');
    });

    // ⭐ TEST KRITIS: Pengembalian terlambat harus ada info denda di response
    it('⭐ harus return 200 dengan pesan DENDA jika pengembalian terlambat', async () => {
      vi.spyOn(LoanService.prototype, 'returnLoan')
        .mockResolvedValueOnce({
          success: true,
          message: 'Buku dikembalikan, namun terlambat 3 hari. Dikenakan denda sebesar Rp 1.500.',
        });

      const response = await request(app)
        .post('/loans/loan-xyz/return');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('terlambat');
      expect(response.body.message).toContain('denda');
    });
  });

  // ==========================================================
  // GET /loans (Admin)
  // ==========================================================
  describe('GET /loans', () => {
    // 🟢 GREEN CASE: Get all loans berhasil
    it('harus return 200 dengan list data pinjaman', async () => {
      const mockLoans = [
        { id: 'loan-1', status: 'pending' },
        { id: 'loan-2', status: 'approved' },
      ];

      vi.spyOn(LoanService.prototype, 'getAllLoans')
        .mockResolvedValueOnce({ success: true, message: 'OK', data: mockLoans } as any);

      const response = await request(app).get('/loans');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    // 🔴 RED CASE: Query parameter status tidak valid
    it('harus return 400 jika status query param bukan nilai yang valid', async () => {
      const response = await request(app)
        .get('/loans?status=invalid-status');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
    });
  });
});
