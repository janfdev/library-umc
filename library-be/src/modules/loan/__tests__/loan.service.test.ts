import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoanService } from '../service/loan.service';
import { db } from '../../../db';

// ============================================================
// ARRANGE: MOCK SEMUA DEPENDENSI EKSTERNAL
// ============================================================

// 1. Mock Database (Drizzle ORM)
//    Kita tidak ingin LoanService benar-benar menyentuh database
vi.mock('../../../db', () => ({
  db: {
    query: {
      loans:   { findFirst: vi.fn(), findMany: vi.fn() },
      items:   { findFirst: vi.fn() },
      members: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

// 1b. Mock DB Schema — tabel reference yang diimport loan.service
//     Tanpa ini, `tx.insert(fines)` akan gagal karena fines bukan plain object
vi.mock('../../../db/schema', () => ({
  loans:   Symbol('loans'),
  items:   Symbol('items'),
  members: Symbol('members'),
  fines:   Symbol('fines'),
  collections: Symbol('collections'),
  locations: Symbol('locations'),
  Users:   Symbol('Users'),
}));

// 2. Mock NotificationService
//    LoanService.approveLoan() memanggil notifikasi email setelah approve.
//    Kita tidak ingin email betulan terkirim saat test.
//    CATATAN: Gunakan class syntax karena LoanService meng-instantiate dengan `new NotificationService()`
vi.mock('../../notification/service/notification.service', () => ({
  NotificationService: class {
    sendLoansNotification = vi.fn().mockResolvedValue(undefined);
    sendReservationFulfilledNotification = vi.fn().mockResolvedValue(undefined);
  },
}));

// 3. Mock ReservationService
//    LoanService.returnLoan() memanggil fulfillNextReservation setelah pengembalian.
//    Ini adalah ketergantungan lintas-modul yang wajib di-mock.
vi.mock('../../reservation/service/reservation.service', () => ({
  default: {
    fulfillNextReservation: vi.fn().mockResolvedValue(undefined),
  },
}));

// ============================================================
// TEST SUITE
// ============================================================
describe('LoanService Unit Tests', () => {
  let loanService: LoanService;

  beforeEach(() => {
    // Reset semua mock sebelum setiap test agar tidak bocor
    vi.clearAllMocks();
    loanService = new LoanService();
  });

  // ==========================================================
  // 1. requestLoan
  // ==========================================================
  describe('requestLoan', () => {
    // 🔴 RED CASE: Batas 3 pinjaman aktif
    it('harus throw Error jika member sudah memiliki 3 pinjaman aktif', async () => {
      // ARRANGE: Rekayasa seolah-olah member sudah punya 3 pinjaman aktif
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([{ count: 3 }]),
        }),
      });

      // ACT & ASSERT
      await expect(
        loanService.requestLoan('member-1', 'item-abc')
      ).rejects.toThrowError(
        'Anda sudah mencapai batas maksimal peminjaman (3 buku). Silakan kembalikan buku terlebih dahulu.'
      );

      // Pastikan insert TIDAK dipanggil karena proses dihentikan lebih awal
      expect(db.insert).not.toHaveBeenCalled();
    });

    // 🔴 RED CASE: Item tidak tersedia
    it('harus throw Error jika item tidak ditemukan atau status bukan "available"', async () => {
      // ARRANGE: Belum punya pinjaman aktif
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([{ count: 0 }]),
        }),
      });

      // ARRANGE: Item ditemukan tapi statusnya "loaned" (tidak tersedia)
      (db.query.items.findFirst as any).mockResolvedValueOnce({
        id: 'item-abc', status: 'loaned',
      });

      // ACT & ASSERT
      await expect(
        loanService.requestLoan('member-1', 'item-abc')
      ).rejects.toThrowError('Buku ini tidak tersedia untuk dipinjam');
    });

    // 🔴 RED CASE: Item tidak ditemukan sama sekali (null)
    it('harus throw Error jika item tidak ditemukan di database', async () => {
      // ARRANGE: Belum punya pinjaman aktif
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([{ count: 0 }]),
        }),
      });
      // ARRANGE: findFirst mengembalikan null (item tidak ada)
      (db.query.items.findFirst as any).mockResolvedValueOnce(null);

      await expect(
        loanService.requestLoan('member-1', 'item-tidak-ada')
      ).rejects.toThrowError('Buku ini tidak tersedia untuk dipinjam');
    });

    // 🟢 GREEN CASE: Berhasil membuat request pinjaman
    it('harus SUKSES membuat loan baru dengan status "pending" dan menghasilkan verificationToken', async () => {
      // ARRANGE: Belum punya pinjaman aktif
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce([{ count: 0 }]),
        }),
      });
      // ARRANGE: Item tersedia
      (db.query.items.findFirst as any).mockResolvedValueOnce({
        id: 'item-abc', status: 'available',
      });
      // ARRANGE: Insert loan berhasil
      const mockLoan = {
        id: 'loan-xyz',
        memberId: 'member-1',
        itemId: 'item-abc',
        status: 'pending',
        verificationToken: 'some-random-hex-token',
        loanDate: '2026-03-22',
        dueDate: '2026-03-29',
      };
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([mockLoan]),
        }),
      });

      // ACT
      const result = await loanService.requestLoan('member-1', 'item-abc');

      // ASSERT: Pastikan result adalah data loan yang dikembalikan DB
      expect(result.id).toBe('loan-xyz');
      expect(result.status).toBe('pending');
      // Pastikan token dihasilkan (verificationToken ada dan bukan string kosong)
      expect(result.verificationToken).toBeTruthy();
      // Pastikan insert dipanggil satu kali
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // 2. verifyToken
  // ==========================================================
  describe('verifyToken', () => {
    // 🔴 RED CASE: Token tidak valid
    it('harus throw Error jika token tidak ditemukan atau pinjaman sudah diproses', async () => {
      // ARRANGE: findFirst mengembalikan null (token tidak ada/sudah terpakai)
      (db.query.loans.findFirst as any).mockResolvedValueOnce(null);

      await expect(
        loanService.verifyToken('token-salah-123')
      ).rejects.toThrowError('Token invalid atau peminjaman sudah di proses');
    });

    // 🔴 RED CASE: Token sudah kadaluarsa
    it('harus throw Error jika token sudah melewati waktu kadaluarsa', async () => {
      // ARRANGE: Loan ditemukan tapi verificationExpiresAt sudah lewat (1 jam yang lalu)
      const expiredTime = new Date(Date.now() - 1 * 60 * 60 * 1000);
      (db.query.loans.findFirst as any).mockResolvedValueOnce({
        id: 'loan-xyz',
        status: 'pending',
        verificationToken: 'token-expired',
        verificationExpiresAt: expiredTime,
      });

      await expect(
        loanService.verifyToken('token-expired')
      ).rejects.toThrowError('Token telah kadaluarsa. Silakan request ulang.');
    });

    // 🟢 GREEN CASE: Token valid dan belum kadaluarsa
    it('harus SUKSES mengembalikan data pinjaman jika token valid dan belum kadaluarsa', async () => {
      // ARRANGE: Token valid, expires 1 jam ke depan
      const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
      const mockLoanData = {
        id:  'loan-xyz',
        status: 'pending',
        verificationToken: 'token-valid-abc',
        verificationExpiresAt: futureTime,
        member: { user: { name: 'Budi' } },
        item: { collection: { title: 'Laskar Pelangi' } },
      };
      (db.query.loans.findFirst as any).mockResolvedValueOnce(mockLoanData);

      const result = await loanService.verifyToken('token-valid-abc');

      expect(result.id).toBe('loan-xyz');
      expect(result.status).toBe('pending');
    });
  });

  // ==========================================================
  // 3. approveLoan
  // ==========================================================
  describe('approveLoan', () => {
    // 🔴 RED CASE: Loan tidak ditemukan
    it('harus throw Error jika loanId tidak ditemukan di database', async () => {
      // ARRANGE: transaction callback, di dalamnya findFirst mengembalikan null
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        // Buat tx palsu yang melempar error ketika findFirst = null
        const tx = {
          query: { loans: { findFirst: vi.fn().mockResolvedValueOnce(null) } },
          update: vi.fn(),
        };
        return cb(tx);
      });

      await expect(
        loanService.approveLoan('loan-tidak-ada', 'admin-1')
      ).rejects.toThrowError('Data peminjaman tidak ditemukan');
    });

    // 🟢 GREEN CASE: Approve berhasil → status loan jadi approved, item jadi loaned
    it('harus SUKSES mengubah status loan ke "approved" dan item ke "loaned"', async () => {
      const mockLoanData = {
        id: 'loan-xyz',
        status: 'pending',
        itemId: 'item-abc',
        dueDate: '2026-03-29',
        member: { user: { name: 'Budi', email: 'budi@mail.com' } },
        item: { collection: { title: 'Laskar Pelangi' } },
      };

      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          query: {
            loans: { findFirst: vi.fn().mockResolvedValueOnce(mockLoanData) },
          },
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValueOnce([{ ...mockLoanData, status: 'approved', itemId: 'item-abc' }]),
              }),
            }),
          }),
        };
        return cb(tx);
      });

      const result = await loanService.approveLoan('loan-xyz', 'admin-1');

      expect(result.message).toContain('berhasil disetujui');
    });
  });

  // ==========================================================
  // 4. rejectLoan
  // ==========================================================
  describe('rejectLoan', () => {
    // 🔴 RED CASE: Loan tidak ditemukan saat reject
    it('harus throw Error jika pinjaman tidak ditemukan saat reject', async () => {
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                // returning() mengembalikan array kosong → loanId tidak ada
                returning: vi.fn().mockResolvedValueOnce([]),
              }),
            }),
          }),
        };
        return cb(tx);
      });

      await expect(
        loanService.rejectLoan('loan-tidak-ada', 'admin-1')
      ).rejects.toThrowError('Peminjaman tidak ditemukan');
    });

    // 🟢 GREEN CASE: Reject berhasil
    it('harus SUKSES menolak pinjaman dan mengembalikan status item ke "available"', async () => {
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValueOnce([{ id: 'loan-xyz', itemId: 'item-abc', status: 'rejected' }]),
              }),
            }),
          }),
        };
        return cb(tx);
      });

      const result = await loanService.rejectLoan('loan-xyz', 'admin-1');
      expect(result.message).toContain('berhasil ditolak');
    });
  });

  // ==========================================================
  // 5. returnLoan — ⭐ KRITIS: Logika denda harus benar
  // ==========================================================
  describe('returnLoan', () => {
    // 🔴 RED CASE: Loan tidak dalam status approved
    it('harus throw Error jika loan tidak dalam status "approved"', async () => {
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          query: {
            loans: {
              findFirst: vi.fn().mockResolvedValueOnce({
                id: 'loan-xyz',
                status: 'returned', // sudah dikembalikan sebelumnya!
              }),
            },
          },
          update: vi.fn(),
        };
        return cb(tx);
      });

      await expect(
        loanService.returnLoan('loan-xyz', 'admin-1')
      ).rejects.toThrowError('Buku ini tidak dalam status dipinjam atau data tidak ditemukan');
    });

    // 🔴 RED CASE: Loan tidak ditemukan
    it('harus throw Error jika loanId tidak ditemukan saat pengembalian', async () => {
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          query: {
            loans: { findFirst: vi.fn().mockResolvedValueOnce(null) },
          },
          update: vi.fn(),
        };
        return cb(tx);
      });

      await expect(
        loanService.returnLoan('loan-tidak-ada', 'admin-1')
      ).rejects.toThrowError('Buku ini tidak dalam status dipinjam atau data tidak ditemukan');
    });

    // 🟢 GREEN CASE: Pengembalian tepat waktu — TANPA denda
    it('harus SUKSES mengembalikan buku tepat waktu tanpa membuat denda', async () => {
      // ARRANGE: dueDate BESOK — pasti tidak dianggap terlambat
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDateStr = tomorrow.toISOString().split('T')[0];

      let txInsertCalled = false; // Spy manual untuk mendeteksi apakah tx.insert dipanggil

      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          query: {
            loans: {
              findFirst: vi.fn().mockResolvedValueOnce({
                id: 'loan-xyz',
                itemId: 'item-abc',
                status: 'approved',
                dueDate: dueDateStr, // tidak terlambat
              }),
            },
            items: {
              findFirst: vi.fn().mockResolvedValueOnce({ id: 'item-abc', collectionId: 'col-1' }),
            },
          },
          // update dipanggil 2x: untuk loans DAN untuk items
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{}]),
            }),
          }),
          insert: vi.fn().mockImplementation(() => {
            txInsertCalled = true; // Catat bahwa insert dipanggil (seharusnya tidak)
            return { values: vi.fn().mockResolvedValue([{}]) };
          }),
        };
        return cb(tx);
      });

      const result = await loanService.returnLoan('loan-xyz', 'admin-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('tepat waktu');
      // Pastikan tx.insert TIDAK dipanggil untuk tabel fines (tidak ada denda)
      expect(txInsertCalled).toBe(false);
    });

    // ⭐ TEST KRITIS: Pengembalian terlambat — HARUS membuat denda
    it('⭐ harus membuat denda otomatis dengan jumlah yang BENAR ketika terlambat 5 hari (5x Rp500 = Rp2500)', async () => {
      // ARRANGE: dueDate 5 hari yang lalu — cukup jauh agar pasti terlambat
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const dueDateStr = fiveDaysAgo.toISOString().split('T')[0];

      let capturedFineInsert: any = null; // Untuk menangkap nilai yang di-insert ke tabel fines

      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          query: {
            loans: {
              findFirst: vi.fn().mockResolvedValueOnce({
                id: 'loan-xyz',
                itemId: 'item-abc',
                status: 'approved',
                dueDate: dueDateStr, // ← 5 hari yang lalu
              }),
            },
            items: {
              findFirst: vi.fn().mockResolvedValueOnce({ id: 'item-abc', collectionId: 'col-1' }),
            },
          },
          // update dipanggil 2x: untuk loans DAN untuk items — gunakan mockReturnValue (bukan Once)
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{}]),
            }),
          }),
          insert: vi.fn().mockImplementation((_table: any) => ({
            values: vi.fn().mockImplementation((data: any) => {
              capturedFineInsert = data; // Tangkap nilai insert untuk diverifikasi
              return Promise.resolve([{}]);
            }),
          })),
        };
        return cb(tx);
      });

      const result = await loanService.returnLoan('loan-xyz', 'admin-1');

      // ASSERT: Response harus menyebutkan ada denda
      expect(result.success).toBe(true);
      expect(result.message).toContain('terlambat');
      expect(result.message).toContain('5 hari');
      expect(result.message).toContain('2.500'); // Rp 500/hari × 5 hari = Rp 2.500

      // ASSERT: Denda benar-benar di-insert ke database dengan nilai yang tepat
      expect(capturedFineInsert).not.toBeNull();
      expect(capturedFineInsert.loanId).toBe('loan-xyz');
      expect(capturedFineInsert.amount).toBe('2500'); // 5 hari × 500
      expect(capturedFineInsert.status).toBe('unpaid');
    });

    // ⭐ TEST KRITIS: returnLoan memanggil fulfillNextReservation (cross-module)
    it('harus memanggil reservationService.fulfillNextReservation setelah pengembalian', async () => {
      // Gunakan dueDate besok agar tidak trigger denda (test ini hanya cek cross-module call)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDateStr = tomorrow.toISOString().split('T')[0];

      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        const tx = {
          query: {
            loans: {
              findFirst: vi.fn().mockResolvedValueOnce({
                id: 'loan-xyz', itemId: 'item-abc', status: 'approved', dueDate: dueDateStr,
              }),
            },
            items: {
              findFirst: vi.fn().mockResolvedValueOnce({ id: 'item-abc', collectionId: 'col-999' }),
            },
          },
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValueOnce([{}]),
            }),
          }),
          insert: vi.fn(),
        };
        return cb(tx);
      });

      await loanService.returnLoan('loan-xyz', 'admin-1');

      // Import modul reservasi untuk verifikasi mock-nya dipanggil
      const reservationService = await import('../../reservation/service/reservation.service');
      expect(reservationService.default.fulfillNextReservation).toHaveBeenCalledWith('col-999');
    });
  });

  // ==========================================================
  // 6. getMemberIdByUserId
  // ==========================================================
  describe('getMemberIdByUserId', () => {
    it('harus mengembalikan undefined jika member tidak ditemukan', async () => {
      (db.query.members.findFirst as any).mockResolvedValueOnce(null);
      const result = await loanService.getMemberIdByUserId('user-999');
      expect(result).toBeUndefined();
    });

    it('harus mengembalikan memberId jika user ditemukan di tabel members', async () => {
      (db.query.members.findFirst as any).mockResolvedValueOnce({
        id: 'member-abc', userId: 'user-1',
      });
      const result = await loanService.getMemberIdByUserId('user-1');
      expect(result).toBe('member-abc');
    });
  });
});
