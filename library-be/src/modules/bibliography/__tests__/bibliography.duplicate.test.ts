import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BibliographyService } from '../service/bibliography.service';
import { db } from '../../../db';

vi.mock('../../../db', () => ({
  db: {
    query: {
      bibliographies: { findMany: vi.fn() },
    },
  },
}));

vi.mock('../../../db/schema', () => ({
  bibliographies: {},
  bibliographyAuthors: {},
  bibliographySubjects: {},
  authors: {},
  subjects: {},
  publishers: {},
  publicationPlaces: {},
  items: {},
  bibliographyFaculties: {},
  bibliographyStudyPrograms: {},
}));

vi.mock('../../audit/service/audit.service', () => ({
  default: { createLog: vi.fn() },
}));

vi.mock('../../shared/utils/stock-sync', () => ({
  syncCollectionAvailableStock: vi.fn(),
}));

describe('BibliographyService - checkDuplicate', () => {
  let service: BibliographyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BibliographyService();
  });

  it('harus return empty jika tidak ada duplikat', async () => {
    (db.query.bibliographies.findMany as any).mockResolvedValue([]);

    const result = await service.checkDuplicate({ isbn: 'ISBN 978-xxx' });
    expect(result.duplicates).toHaveLength(0);
    expect(result.hasExactMatch).toBe(false);
  });

  it('harus deteksi duplikat via ISBN exact match', async () => {
    (db.query.bibliographies.findMany as any).mockResolvedValue([
      { id: '1', title: 'Pemrograman Web', isbnIssn: 'ISBN 978-xxx', classification: '005', callNumber: '005.1', bibliographyAuthors: [] },
    ]);

    const result = await service.checkDuplicate({ isbn: 'ISBN 978-xxx' });
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].similarity).toBe('isbn');
    expect(result.hasExactMatch).toBe(true);
  });

  it('harus deteksi duplikat via title + author fuzzy match', async () => {
    (db.query.bibliographies.findMany as any).mockResolvedValue([
      {
        id: '2', title: 'Belajar TypeScript', isbnIssn: null, classification: '005.13', callNumber: '005.13',
        bibliographyAuthors: [{ author: { name: 'John Doe' } }],
      },
    ]);

    const result = await service.checkDuplicate({ title: 'TypeScript', author: 'John' });
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].similarity).toBe('title_author');
  });

  it('harus deduplikasi hasil ISBN dan title', async () => {
    (db.query.bibliographies.findMany as any)
      .mockResolvedValueOnce([
        { id: '1', title: 'Web Dev', isbnIssn: 'ISBN 978-xxx', classification: null, callNumber: null, bibliographyAuthors: [] },
      ])
      .mockResolvedValueOnce([
        { id: '1', title: 'Web Dev', isbnIssn: 'ISBN 978-xxx', classification: null, callNumber: null, bibliographyAuthors: [] },
      ]);

    const result = await service.checkDuplicate({ isbn: 'ISBN 978-xxx', title: 'Web Dev' });
    expect(result.duplicates).toHaveLength(1);
  });
});
