import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// ARRANGE: MOCK SEMUA DEPENDENSI EKSTERNAL
// ============================================================

// 1. Mock Database (Drizzle ORM)
//    Buat full chain yang bisa di-method-chain:
//    db.select({...}).from(t).leftJoin(t,c).leftJoin(t,c)...where(...).limit(n)
//    Strategi: setiap method kembalikan object yang sama (chainable)
//    Method terakhir (limit / offset) mengembalikan Promise

const buildChain = (resolvedValue: unknown) => {
  const result = Promise.resolve(resolvedValue);
  // Proxy agar setiap method apapun mengembalikan chain yang sama,
  // kecuali fungsi yang perlu resolve (limit, offset, returning)
  const chainMethods: Record<string, unknown> = {};
  const methodNames = ['from', 'leftJoin', 'innerJoin', 'where', 'orderBy'];
  methodNames.forEach((m) => {
    chainMethods[m] = vi.fn().mockReturnValue(chainMethods);
  });
  // limit/offset = terminal: kembalikan Promise
  chainMethods['limit'] = vi.fn().mockReturnValue({
    offset: vi.fn().mockReturnValue(result),
    // jika limit langsung resolve (alias: .limit(1) tanpa .offset)
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  });
  // Support direct await pada chain (jika .limit() di-await langsung)
  (chainMethods as any).then = undefined; // hindari auto-await pada chain
  return chainMethods;
};

vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('../../../db/schema', () => ({
  fines:        Symbol('fines'),
  loans:        Symbol('loans'),
  items:        Symbol('items'),
  members:      Symbol('members'),
  Users:        Symbol('Users'),
  collections:  Symbol('collections'),
  transactions: Symbol('transactions'),
  locations:    Symbol('locations'),
}));

vi.mock('../../../exceptions/AppError', () => ({
  BadRequestError: class BadRequestError extends Error {
    constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
  },
  InternalServerError: class InternalServerError extends Error {
    constructor(msg: string) { super(msg); this.name = 'InternalServerError'; }
  },
}));

import { db } from '../../../db';

// ============================================================
// TEST SUITE
// ============================================================
describe('FinesService Unit Tests', () => {
  let finesService: Awaited<typeof import('../service/fines.service')>['default'];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../service/fines.service');
    finesService = mod.default;
  });

  // ==========================================================
  // getAllFines
  // ==========================================================
  describe('getAllFines', () => {
    it('harus mengembalikan list denda dengan format data yang benar', async () => {
      const mockRows = [
        {
          id: 'fine-1', amount: '2500', status: 'unpaid', loanId: 'loan-1',
          dueDate: '2026-03-01', memberName: 'Budi', memberEmail: 'budi@mail.com', title: 'Laskar Pelangi',
        },
      ];
      const chain = buildChain(mockRows);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await finesService.getAllFines({ status: 'unpaid' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('fine-1');
      // amount harus dikonversi ke Number
      expect(result.data[0].amount).toBe(2500);
      expect(result.data[0].loan.member.user.name).toBe('Budi');
      expect(result.data[0].loan.item.collection.title).toBe('Laskar Pelangi');
    });

    it('harus mengembalikan array kosong jika tidak ada denda yang cocok', async () => {
      const chain = buildChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await finesService.getAllFines({ status: 'paid' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  // ==========================================================
  // getFineById
  // ==========================================================
  describe('getFineById', () => {
    it('harus melempar NotFoundError jika fineId tidak ada di database', async () => {
      // Service melakukan: .select({...}).from(f).leftJoin(...).leftJoin(...).leftJoin(...).leftJoin(...).where(...).limit(1)
      // Semua chain harus di-mock agar tidak throw "is not a function"
      const emptyChain = buildChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(emptyChain);

      // Service re-throws NotFoundError sehingga kita bisa expect pesan aslinya
      await expect(finesService.getFineById('fine-tidak-ada')).rejects.toThrow('Fine not found');
    });

    it('harus mengembalikan detail denda jika fineId ditemukan (status unpaid)', async () => {
      const mockRow = {
        id: 'fine-1', amount: '1500', status: 'unpaid', loanId: 'loan-1',
        createdAt: new Date(), updatedAt: new Date(),
        dueDate: '2026-03-01', memberName: 'Budi', memberEmail: 'budi@mail.com', title: 'Laskar Pelangi',
      };
      const chain = buildChain([mockRow]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await finesService.getFineById('fine-1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('fine-1');
      expect(result.data.amount).toBe(1500);
      expect(result.data.transaction).toBeNull();
    });
  });

  // ==========================================================
  // createFineManual
  // ==========================================================
  describe('createFineManual', () => {
    it('harus melempar error jika amount <= 0', async () => {
      // Service melempar BadRequestError sebelum DB query → langsung throw (tanpa InternalServerError wrapping)
      await expect(finesService.createFineManual('loan-1', 0)).rejects.toThrow('Amount must be greater than 0');
      await expect(finesService.createFineManual('loan-1', -500)).rejects.toThrow('Amount must be greater than 0');
    });

    it('harus melempar error (InternalServerError) jika loanId tidak ada di database', async () => {
      // DB mengembalikan array kosong → service throws NotFoundError → di-catch → InternalServerError
      const emptyChain = buildChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(emptyChain);

      // Karena NotFoundError tertangkap oleh try-catch dan di-wrap jadi InternalServerError
      await expect(finesService.createFineManual('loan-tidak-ada', 1000)).rejects.toThrow();
    });

    it('harus melempar error jika loan sudah mempunyai denda unpaid', async () => {
      // Call 1: cek loan ada → ada
      const loanChain = buildChain([{ id: 'loan-1' }]);
      // Call 2: cek existing fine → sudah ada
      const fineChain = buildChain([{ id: 'fine-existing' }]);
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(loanChain)
        .mockReturnValueOnce(fineChain);

      await expect(finesService.createFineManual('loan-1', 1000)).rejects.toThrow();
    });

    it('harus SUKSES membuat denda manual jika data valid dan tidak ada denda sebelumnya', async () => {
      // Call 1: cek loan ada → ada
      const loanChain = buildChain([{ id: 'loan-1' }]);
      // Call 2: cek existing fine → tidak ada
      const noFineChain = buildChain([]);
      (db.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(loanChain)
        .mockReturnValueOnce(noFineChain);

      const mockInserted = { id: 'fine-new', loanId: 'loan-1', amount: '2500', status: 'unpaid' };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockInserted]),
        }),
      });

      const result = await finesService.createFineManual('loan-1', 2500);

      expect(result.success).toBe(true);
      expect(result.message).toContain('created');
      expect(result.data.amount).toBe('2500');
    });
  });

  // ==========================================================
  // payFine — ⭐ KRITIS
  // ==========================================================
  describe('payFine', () => {
    it('harus melempar error jika fineId tidak ditemukan', async () => {
      (db.transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          select: vi.fn().mockReturnValue(buildChain([])), // kosong = tidak ditemukan
          update: vi.fn(),
          insert: vi.fn(),
        };
        return cb(tx);
      });

      await expect(finesService.payFine('fine-tidak-ada', 'admin-1', 'cash')).rejects.toThrow();
    });

    it('harus melempar error jika denda sudah berstatus paid', async () => {
      (db.transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          select: vi.fn().mockReturnValue(buildChain([{ id: 'fine-1', status: 'paid' }])),
          update: vi.fn(),
          insert: vi.fn(),
        };
        return cb(tx);
      });

      await expect(finesService.payFine('fine-1', 'admin-1', 'cash')).rejects.toThrow();
    });

    it('⭐ harus SUKSES memproses pembayaran dan membuat record transaksi', async () => {
      const mockUpdatedFine = { id: 'fine-1', status: 'paid', amount: '2500' };
      const mockTx = { id: 'tx-1', fineId: 'fine-1', paymentMethod: 'cash' };

      (db.transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          select: vi.fn().mockReturnValue(buildChain([{ id: 'fine-1', status: 'unpaid' }])),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockUpdatedFine]),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockTx]),
            }),
          }),
        };
        return cb(tx);
      });

      const result = await finesService.payFine('fine-1', 'admin-1', 'cash');

      expect(result.success).toBe(true);
      expect(result.message).toContain('paid');
      expect(result.data.fine.status).toBe('paid');
      expect(result.data.transaction.paymentMethod).toBe('cash');
    });
  });

  // ==========================================================
  // deleteFine
  // ==========================================================
  describe('deleteFine', () => {
    it('harus melempar NotFoundError jika fineId tidak ada', async () => {
      const emptyChain = buildChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(emptyChain);

      // Service pattern: if (error instanceof NotFoundError) throw error;
      await expect(finesService.deleteFine('fine-tidak-ada')).rejects.toThrow('Fine not found');
    });

    it('harus SUKSES melakukan soft delete pada denda yang ada', async () => {
      const existChain = buildChain([{ id: 'fine-1' }]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(existChain);

      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{}]),
        }),
      });

      const result = await finesService.deleteFine('fine-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
      expect(result.data).toBeNull();
    });
  });
});
