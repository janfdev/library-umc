import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacultyService } from '../service/faculty.service';
import { db } from '../../../db';
import auditService from '../../audit/service/audit.service';

vi.mock('../../../db', () => ({
  db: {
    query: {
      faculties: { findFirst: vi.fn() },
      studyPrograms: { findFirst: vi.fn() },
      bibliographyFaculties: { findFirst: vi.fn() }
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn()
        })
      })
    }),
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

describe('FacultyService', () => {
  let facultyService: FacultyService;

  beforeEach(() => {
    vi.clearAllMocks();
    facultyService = new FacultyService();
  });

  describe('create', () => {
    it('harus sukses membuat faculty baru', async () => {
      (db.query.faculties.findFirst as any).mockResolvedValueOnce(null);
      const mockResult = { id: 1, name: 'Fakultas Teknik', code: 'FT' };
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([mockResult])
        })
      });

      const result = await facultyService.create({ name: 'Fakultas Teknik', code: 'FT' }, 'admin-id', '::1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(auditService.createLog).toHaveBeenCalledWith({
        userId: 'admin-id', action: 'create', entity: 'faculty', entityId: '1', ipAddress: '::1'
      });
    });

    it('harus menolak jika nama duplikat', async () => {
      (db.query.faculties.findFirst as any).mockResolvedValueOnce({ id: 1, name: 'Fakultas Teknik' });
      const result = await facultyService.create({ name: 'Fakultas Teknik' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Faculty with this name already exists');
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('harus menolak jika fakultas masih punya study program', async () => {
      (db.query.faculties.findFirst as any).mockResolvedValueOnce({ id: 1, name: 'FT' });
      (db.query.studyPrograms.findFirst as any).mockResolvedValueOnce({ id: 10, name: 'TI' });

      const result = await facultyService.softDelete(1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('existing study programs');
      expect(db.update).not.toHaveBeenCalled();
    });
  });
});
