import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../db", () => ({
  db: {
    query: {
      importBatches: { findFirst: vi.fn(), findMany: vi.fn() },
      importBibliographyRows: { findMany: vi.fn() },
      importItemRows: { findMany: vi.fn() },
      importErrors: { findMany: vi.fn() },
      importBibliographyItemCodes: { findMany: vi.fn() },
      bibliographies: { findFirst: vi.fn(), findMany: vi.fn() },
      items: { findFirst: vi.fn() },
      authors: { findFirst: vi.fn() },
      subjects: { findFirst: vi.fn() },
      publishers: { findFirst: vi.fn() },
      publicationPlaces: { findFirst: vi.fn() },
      gmds: { findFirst: vi.fn() },
      languages: { findFirst: vi.fn() },
      locations: { findFirst: vi.fn() },
      collectionTypes: { findFirst: vi.fn() },
      vendors: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    }),
    execute: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn((fn: any) => Promise.resolve(fn({}))),
  },
}));

vi.mock("../../../db/schema", () => ({
  importBatches: Symbol("importBatches"),
  importBibliographyRows: Symbol("importBibliographyRows"),
  importItemRows: Symbol("importItemRows"),
  importErrors: Symbol("importErrors"),
  importBibliographyItemCodes: Symbol("importBibliographyItemCodes"),
  bibliographies: Symbol("bibliographies"),
  items: Symbol("items"),
  bibliographyAuthors: Symbol("bibliographyAuthors"),
  bibliographySubjects: Symbol("bibliographySubjects"),
  authors: Symbol("authors"),
  subjects: Symbol("subjects"),
  publishers: Symbol("publishers"),
  publicationPlaces: Symbol("publicationPlaces"),
  gmds: Symbol("gmds"),
  collectionTypes: Symbol("collectionTypes"),
  languages: Symbol("languages"),
  locations: Symbol("locations"),
  vendors: Symbol("vendors"),
}));

vi.mock("../../shared/utils/stock-sync", () => ({
  syncCollectionAvailableStock: vi.fn().mockResolvedValue(undefined),
}));

import { ImportService } from "../service/import.service";

describe("ImportService", () => {
  let importService: ImportService;

  beforeEach(() => {
    vi.resetAllMocks();
    importService = new ImportService();
  });

  describe("Batch creation", () => {
    it("should create a batch with correct type", async () => {
      const { db } = await import("../../../db");
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: "batch-1",
            type: "bibliography",
            filename: "test.csv",
            status: "uploading",
          }]),
        }),
      });

      const result = await importService.createBatch(
        "bibliography", "test.csv", "user-1", "col1;col2\nval1;val2"
      );

      expect(result.id).toBe("batch-1");
      expect(result.type).toBe("bibliography");
    });
  });

  describe("Batch state machine", () => {
    it("should reject parsing a committed batch", async () => {
      const { db } = await import("../../../db");
      (db.query.importBatches.findFirst as any).mockResolvedValue({
        id: "batch-1", status: "committed",
      });
      await expect(importService.parseBatch("batch-1")).rejects.toThrow("committed");
    });

    it("should reject approving a non-preview batch", async () => {
      const { db } = await import("../../../db");
      (db.query.importBatches.findFirst as any).mockResolvedValue({
        id: "batch-1", status: "uploading",
      });
      await expect(importService.approveBatch("batch-1", "user-1")).rejects.toThrow("uploading");
    });

    it("should reject canceling a committed batch", async () => {
      const { db } = await import("../../../db");
      (db.query.importBatches.findFirst as any).mockResolvedValue({
        id: "batch-1", status: "committed",
      });
      await expect(importService.cancelBatch("batch-1")).rejects.toThrow("committed");
    });
  });

  describe("Preview", () => {
    it("should return batch info and rows", async () => {
      const { db } = await import("../../../db");
      (db.query.importBatches.findFirst as any).mockResolvedValue({
        id: "batch-1", type: "bibliography", status: "preview",
        totalRows: 10, validRows: 8, invalidRows: 2, committedRows: 0,
      });
      (db.query.importBibliographyRows.findMany as any).mockResolvedValue([]);
      (db.query.importErrors.findMany as any).mockResolvedValue([]);
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 10 }]),
        }),
      });

      const result = await importService.previewBatch("batch-1");
      expect(result.batch.id).toBe("batch-1");
      expect(result.batch.totalRows).toBe(10);
    });
  });

  describe("Cancel", () => {
    it("should cancel a preview batch", async () => {
      const { db } = await import("../../../db");
      (db.query.importBatches.findFirst as any).mockResolvedValue({
        id: "batch-1", status: "preview",
      });
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await importService.cancelBatch("batch-1");
      expect(result.success).toBe(true);
    });
  });

  describe("Errors", () => {
    it("should return errors for a batch", async () => {
      const { db } = await import("../../../db");
      (db.query.importErrors.findMany as any).mockResolvedValue([
        { rowNumber: 1, errors: ["title required"] },
      ]);

      const errors = await importService.getErrors("batch-1");
      expect(errors.length).toBe(1);
    });
  });
});
