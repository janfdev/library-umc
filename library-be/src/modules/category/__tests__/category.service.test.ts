import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../service/category.service';
import { db } from '../../../db';
import auditService from '../../audit/service/audit.service';

// 1. ARRANGE: MOCK DATABASE (Drizzle ORM)
vi.mock('../../../db', () => ({
  db: {
    query: {
      categories: { findFirst: vi.fn() },
      collections: { findFirst: vi.fn() }
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn()
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn()
        })
      })
    })
  }
}));

// 2. ARRANGE: MOCK AUDIT SERVICE
vi.mock('../../audit/service/audit.service', () => ({
  default: {
    createLog: vi.fn()
  }
}));

describe('CategoryService Unit Tests', () => {
  let categoryService: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    categoryService = new CategoryService();
  });

  describe('createCategory', () => {
    it('harus error jika nama kategori kosong', async () => {
      const result = await categoryService.createCategory({ name: '', description: '' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Category name is required');
    });

    it('harus menolak pembuatan jika nama kategori sudah pernah dibuat sebelumnya', async () => {
      // Kita merekayasa DB seakan-olah nama "Fiksi" sudah ada di tabel
      (db.query.categories.findFirst as any).mockResolvedValueOnce({ id: 1, name: 'Fiksi' });

      const result = await categoryService.createCategory({ name: 'Fiksi', description: '' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Category with this name already exists');
      
      // Buktikan bahwa db.insert TIDAK PERNAH dipanggil karena proses sudah dibatalkan
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('harus sukses membuat kategori jika unik dan valid, lalu mencatat Audit Log', async () => {
      // 1. Rekayasa DB: Kategori belum ada
      (db.query.categories.findFirst as any).mockResolvedValueOnce(null);
      
      // 2. Rekayasa DB: Insert berhasil dan mengembalikan 1 array hasil
      const mockInsertedData = { id: 5, name: 'Science', description: 'Logika Ilmu Alam' };
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([mockInsertedData])
        })
      });

      const result = await categoryService.createCategory(
        { name: 'Science', description: 'Logika Ilmu Alam' }, 
        'admin-id-123', // userId untuk audit
        '192.168.1.1'   // ipAddress untuk audit
      );

      // Cek output fungsi
      expect(result.success).toBe(true);
      expect(result.message).toBe('Category created successfully');
      expect(result.data).toEqual(mockInsertedData);

      // Cek apakah Audit Log dipanggil persis setelah insert kategori
      expect(auditService.createLog).toHaveBeenCalledTimes(1);
      expect(auditService.createLog).toHaveBeenCalledWith({
        userId: 'admin-id-123',
        action: 'create',
        entity: 'category',
        entityId: '5',
        ipAddress: '192.168.1.1'
      });
    });
  });

  describe('deleteCategory', () => {
    it('harus menolak penghapusan jika kategori masih dipakai oleh Collection/Buku', async () => {
      // 1. Rekayasa DB: Kategori ditemukan
      (db.query.categories.findFirst as any).mockResolvedValueOnce({ id: 1, name: 'Fiksi' });
      // 2. Rekayasa DB: Koleksi buku yang memakai kategori ini ADA (Ditemukan)
      (db.query.collections.findFirst as any).mockResolvedValueOnce({ id: 10, title: 'Harry Potter', categoryId: 1 });

      const result = await categoryService.deleteCategory(1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('It is being used by one or more collections');
      expect(db.update).not.toHaveBeenCalled(); // Jangan sampai ke-delete
    });
  });
});
