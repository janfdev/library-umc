import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyProgramService } from '../service/study-program.service';
import { db } from '../../../db';
import auditService from '../../audit/service/audit.service';

vi.mock('../../../db', () => ({
  db: {
    query: {
      studyPrograms: { findMany: vi.fn(), findFirst: vi.fn() },
      faculties: { findFirst: vi.fn() },
      bibliographyStudyPrograms: { findFirst: vi.fn() }
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

vi.mock('../../audit/service/audit.service', () => ({
  default: { createLog: vi.fn() }
}));

describe('StudyProgramService', () => {
  let spService: StudyProgramService;

  beforeEach(() => {
    vi.clearAllMocks();
    spService = new StudyProgramService();
  });

  describe('create', () => {
    it('harus sukses membuat study program baru', async () => {
      (db.query.studyPrograms.findFirst as any).mockResolvedValueOnce(null);
      (db.query.faculties.findFirst as any).mockResolvedValueOnce({ id: 1, name: 'FIK' });
      const mockResult = { id: 1, name: 'Teknik Informatika', code: 'TI', facultyId: 1 };
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([mockResult])
        })
      });

      const result = await spService.create({ name: 'Teknik Informatika', code: 'TI', facultyId: 1 }, 'admin', '::1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(auditService.createLog).toHaveBeenCalled();
    });

    it('harus menolak jika nama duplikat dalam faculty yang sama', async () => {
      (db.query.studyPrograms.findFirst as any).mockResolvedValueOnce({ id: 1, name: 'TI' });
      const result = await spService.create({ name: 'TI', facultyId: 1 });
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    it('harus menolak jika faculty tidak ditemukan', async () => {
      (db.query.studyPrograms.findFirst as any).mockResolvedValueOnce(null);
      (db.query.faculties.findFirst as any).mockResolvedValueOnce(null);
      const result = await spService.create({ name: 'TI', facultyId: 999 });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Faculty not found');
    });
  });

  describe('getAll', () => {
    it('harus mengembalikan semua study program', async () => {
      (db.query.studyPrograms.findMany as any).mockResolvedValueOnce([{ id: 1, name: 'TI', faculty: { id: 1, name: 'FIK' } }]);
      const result = await spService.getAll();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('harus filter berdasarkan facultyId', async () => {
      (db.query.studyPrograms.findMany as any).mockResolvedValueOnce([{ id: 1, name: 'TI', facultyId: 1 }]);
      const result = await spService.getAll(1);
      expect(result.success).toBe(true);
    });
  });
});
