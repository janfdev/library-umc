import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// ARRANGE: MOCK SEMUA DEPENDENSI EKSTERNAL
// ============================================================

const buildChain = (resolvedValue: unknown) => {
  const result = Promise.resolve(resolvedValue);
  const chainMethods: Record<string, unknown> = {};
  const methodNames = ['from', 'leftJoin', 'innerJoin', 'where', 'orderBy', 'limit'];
  methodNames.forEach((m) => {
    chainMethods[m] = vi.fn().mockReturnValue(chainMethods);
  });
  // Method yang me-resolve Promise
  chainMethods['then'] = result.then.bind(result);
  chainMethods['catch'] = result.catch.bind(result);
  return chainMethods as any;
};

// Mock Drizzle DB
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock DB Schema
vi.mock('../../db/schema', () => ({
  fines:        Symbol('fines'),
  loans:        Symbol('loans'),
  items:        Symbol('items'),
  members:      Symbol('members'),
  Users:        Symbol('Users'),
  collections:  Symbol('collections'),
}));

const { mockSendFinesNotification } = vi.hoisted(() => {
  return { mockSendFinesNotification: vi.fn() };
});

vi.mock('../../modules/notification/service/notification.service', () => {
  return {
    NotificationService: class {
      sendFinesNotification = mockSendFinesNotification;
    }
  };
});

import { db } from '../../db';
import { checkAndUpdateFines } from '../fineScheduler';

describe('fineScheduler Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Bypass timer (setTimeout API delay)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('harus memproses kalkulasi denda dan mengirim email dengan benar', async () => {
    // Skenario: 
    // 1. Ada 1 buku overdue (belum dikembalikan).
    // 2. Ada 1 denda unpaid yang butuh dikirimi notifikasi email hari ini.

    // Mock Date hari ini agar konsisten saat ditest:
    const mockToday = new Date('2026-06-08T00:00:00+07:00');
    vi.setSystemTime(mockToday);

    // Mock db.select() behaviour
    (db.select as any)
      .mockImplementationOnce(() => buildChain([
        { loanId: 'loan-1', dueDate: '2026-06-05' } // Telat 3 hari (dari tgl 5 ke 8)
      ]))
      .mockImplementationOnce(() => buildChain([
        // Kosong: artinya belum ada record denda di tabel fines (harus insert)
      ]))
      .mockImplementationOnce(() => buildChain([
        // List unpaid fines: ada 1
        {
          fineId: 'fine-1',
          amount: '1500', // Telat 3 hari = 1500
          lastNotifiedAt: null, // Belum pernah dinotifikasi
          loanId: 'loan-1',
          userEmail: 'mahasiswa@gmail.com',
          userName: 'Mahasiswa',
          bookTitle: 'Buku Pemrograman'
        }
      ]));

    // Mock db.insert dan db.update
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue(true)
    });
    
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true)
      })
    });

    // Jalankan scheduler (jeda setTimeout API disimulasikan)
    const checkPromise = checkAndUpdateFines();
    await vi.runAllTimersAsync(); // mempercepat delay setTimeout(1000)
    await checkPromise;

    // ASERTASI KALKULASI DENDA
    // Karena belum ada fine sebelumnya, harus memanggil db.insert dengan jumlah denda yang benar
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect((db.insert as any)().values).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId: 'loan-1',
        amount: '1500', // 3 hari * 500
        status: 'unpaid'
      })
    );

    // ASERTASI NOTIFIKASI EMAIL
    // Email harus dikirim untuk fine yang unpaid dan belum dinotifikasi hari ini
    expect(mockSendFinesNotification).toHaveBeenCalledTimes(1);
    expect(mockSendFinesNotification).toHaveBeenCalledWith(
      'mahasiswa@gmail.com',
      'Mahasiswa',
      1500, // totalDenda
      'Buku Pemrograman',
      3, // diffDays
      false // isBookReturned
    );

    // ASERTASI UPDATE STATUS NOTIFIKASI
    // lastNotifiedAt harus diperbarui
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('harus skip pengiriman email jika lastNotifiedAt sudah hari ini', async () => {
    const mockToday = new Date('2026-06-08T00:00:00+07:00');
    vi.setSystemTime(mockToday);

    (db.select as any)
      .mockImplementationOnce(() => buildChain([])) // Tidak ada ongoing loan
      .mockImplementationOnce(() => buildChain([
        {
          fineId: 'fine-1',
          amount: '1500',
          lastNotifiedAt: new Date('2026-06-08T10:00:00+07:00'), // Sudah dinotif HARI INI
          loanId: 'loan-1',
          userEmail: 'mahasiswa@gmail.com',
          userName: 'Mahasiswa',
          bookTitle: 'Buku Pemrograman'
        }
      ]));

    const checkPromise = checkAndUpdateFines();
    await vi.runAllTimersAsync();
    await checkPromise;

    // Tidak boleh ada pengiriman email sama sekali
    expect(mockSendFinesNotification).not.toHaveBeenCalled();
    // Tidak boleh ada update lastNotifiedAt di db
    expect(db.update).not.toHaveBeenCalled();
  });

  it('harus mengirim email denda jika buku sudah dikembalikan DAN hari ini adalah hari Senin', async () => {
    // 2026-06-08 is a Monday
    const mockMonday = new Date('2026-06-08T00:00:00+07:00');
    vi.setSystemTime(mockMonday);

    (db.select as any)
      .mockImplementationOnce(() => buildChain([])) // Tidak ada ongoing loan
      .mockImplementationOnce(() => buildChain([
        {
          fineId: 'fine-1',
          amount: '1500',
          lastNotifiedAt: null,
          loanId: 'loan-1',
          loanStatus: 'returned', // Buku sudah dikembalikan
          userEmail: 'mahasiswa@gmail.com',
          userName: 'Mahasiswa',
          bookTitle: 'Buku Pemrograman'
        }
      ]));

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true)
      })
    });

    const checkPromise = checkAndUpdateFines();
    await vi.runAllTimersAsync();
    await checkPromise;

    // Email harus dikirim karena hari ini hari Senin
    expect(mockSendFinesNotification).toHaveBeenCalledTimes(1);
    expect(mockSendFinesNotification).toHaveBeenCalledWith(
      'mahasiswa@gmail.com',
      'Mahasiswa',
      1500,
      'Buku Pemrograman',
      3,
      true // isBookReturned = true
    );
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('harus skip pengiriman email denda jika buku sudah dikembalikan DAN hari ini BUKAN hari Senin', async () => {
    // 2026-06-09 is a Tuesday
    const mockTuesday = new Date('2026-06-09T00:00:00+07:00');
    vi.setSystemTime(mockTuesday);

    (db.select as any)
      .mockImplementationOnce(() => buildChain([])) // Tidak ada ongoing loan
      .mockImplementationOnce(() => buildChain([
        {
          fineId: 'fine-1',
          amount: '1500',
          lastNotifiedAt: null,
          loanId: 'loan-1',
          loanStatus: 'returned', // Buku sudah dikembalikan
          userEmail: 'mahasiswa@gmail.com',
          userName: 'Mahasiswa',
          bookTitle: 'Buku Pemrograman'
        }
      ]));

    const checkPromise = checkAndUpdateFines();
    await vi.runAllTimersAsync();
    await checkPromise;

    // Tidak boleh dikirim email karena hari Selasa (bukan Senin)
    expect(mockSendFinesNotification).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});
