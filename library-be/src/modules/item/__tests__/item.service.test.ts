import { describe, expect, it, vi, beforeEach } from "vitest";
import { ItemService } from "../service/item.service";
import { db } from "../../../db";

vi.mock("../../../db", () => {
  const defaultTx = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "item-1", collectionId: "coll-1", status: "available", barcode: "OLD-001" },
          ]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: "new-item-id", collectionId: "coll-1", status: "available" },
        ]),
      }),
    }),
  };
  return {
    db: {
      query: {
        items: { findFirst: vi.fn(), findMany: vi.fn() },
        collections: { findFirst: vi.fn() },
        locations: { findFirst: vi.fn() },
      },
      insert: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn((fn: any) => Promise.resolve(fn(defaultTx))),
    },
  };
});

vi.mock("../../../db/schema", () => ({
  items: Symbol("items"),
  collections: Symbol("collections"),
  locations: Symbol("locations"),
}));

vi.mock("../../shared/utils/stock-sync", () => ({
  syncCollectionAvailableStock: vi.fn().mockResolvedValue(undefined),
}));

function createMockTx(availableCount = 0) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: availableCount }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "item-1", collectionId: "coll-1", status: "available", barcode: "OLD-001" },
          ]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: "new-item-id", collectionId: "coll-1", status: "available" },
        ]),
      }),
    }),
  };
}

describe("ItemService Unit Tests", () => {
  let itemService: ItemService;

  beforeEach(() => {
    vi.resetAllMocks();
    itemService = new ItemService();
  });

  describe("createItem", () => {
    it("should create item and sync stock in transaction", async () => {
      (db.query.items.findFirst as any).mockResolvedValue(null);
      (db.query.collections.findFirst as any).mockResolvedValue({
        id: "coll-1",
      });
      (db.query.locations.findFirst as any).mockResolvedValue({
        id: 1,
      });

      const mockTx = createMockTx(1);
      (db.transaction as any).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await itemService.createItem({
        collectionId: "coll-1",
        locationId: 1,
        barcode: "TEST-001",
        itemCode: "TEST-001",
      });

      expect(result.success).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it("should reject duplicate item_code", async () => {
      (db.query.items.findFirst as any).mockResolvedValue({
        id: "existing",
        itemCode: "TEST-001",
      });

      const result = await itemService.createItem({
        collectionId: "coll-1",
        locationId: 1,
        barcode: "TEST-001",
        itemCode: "TEST-001",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("item_code already exists");
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("should reject if collection not found", async () => {
      (db.query.items.findFirst as any).mockResolvedValue(null);
      (db.query.collections.findFirst as any).mockResolvedValue(null);

      const result = await itemService.createItem({
        collectionId: "nonexistent",
        locationId: 1,
        barcode: "TEST-002",
        itemCode: "TEST-002",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Collection not found");
    });

    it("should reject if location not found", async () => {
      (db.query.items.findFirst as any).mockResolvedValue(null);
      (db.query.collections.findFirst as any).mockResolvedValue({
        id: "coll-1",
      });
      (db.query.locations.findFirst as any).mockResolvedValue(null);

      const result = await itemService.createItem({
        collectionId: "coll-1",
        locationId: 999,
        barcode: "TEST-003",
        itemCode: "TEST-003",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Location not found");
    });
  });

  describe("deleteItem", () => {
    it("should soft-delete and sync stock in transaction", async () => {
      (db.query.items.findFirst as any).mockResolvedValue({
        id: "item-1",
        collectionId: "coll-1",
        status: "available",
      });

      const mockTx = createMockTx(0);
      (db.transaction as any).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await itemService.deleteItem("item-1");

      expect(result.success).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
    });

    it("should reject deletion of loaned item", async () => {
      (db.query.items.findFirst as any).mockResolvedValue({
        id: "item-1",
        collectionId: "coll-1",
        status: "loaned",
      });

      const result = await itemService.deleteItem("item-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Cannot delete loaned item");
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("should reject if item not found", async () => {
      (db.query.items.findFirst as any).mockResolvedValue(null);

      const result = await itemService.deleteItem("nonexistent");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Item not found");
    });
  });

  describe("updateItem", () => {
    it("should sync stock when status changes", async () => {
      (db.query.items.findFirst as any).mockResolvedValue({
        id: "item-1",
        collectionId: "coll-1",
        status: "available",
        barcode: "OLD-001",
      });

      const mockTx = createMockTx(0);
      mockTx.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              { id: "item-1", status: "damaged" },
            ]),
          }),
        }),
      });

      (db.transaction as any).mockImplementation(async (fn: any) => fn(mockTx));

      const { syncCollectionAvailableStock } = await import(
        "../../shared/utils/stock-sync"
      );

      const result = await itemService.updateItemStatus("item-1", "damaged");

      expect(result.success).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
      expect(syncCollectionAvailableStock).toHaveBeenCalledWith(
        mockTx,
        "coll-1"
      );
    });

    it("should NOT sync stock when status does not change", async () => {
      (db.query.items.findFirst as any)
        .mockResolvedValueOnce({
          id: "item-1",
          collectionId: "coll-1",
          status: "available",
          barcode: "OLD-001",
        })
        .mockResolvedValueOnce(null);

      const mockTx = createMockTx(0);
      mockTx.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              { id: "item-1", barcode: "NEW-001" },
            ]),
          }),
        }),
      });

      const { syncCollectionAvailableStock } = await import(
        "../../shared/utils/stock-sync"
      );

      (syncCollectionAvailableStock as any).mockClear();

      (db.transaction as any).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await itemService.updateItem("item-1", {
        barcode: "NEW-001",
      });

      expect(result.success).toBe(true);
      expect(syncCollectionAvailableStock).not.toHaveBeenCalled();
    });

    it("should reject if item not found", async () => {
      (db.query.items.findFirst as any).mockResolvedValue(null);

      const result = await itemService.updateItem("nonexistent", {
        barcode: "NEW",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Item not found");
    });

    it("should reject duplicate barcode on update", async () => {
      (db.query.items.findFirst as any)
        .mockResolvedValueOnce({
          id: "item-1",
          collectionId: "coll-1",
          status: "available",
          barcode: "OLD-001",
        })
        .mockResolvedValueOnce({
          id: "item-2",
          barcode: "TAKEN-001",
        });

      const result = await itemService.updateItem("item-1", {
        barcode: "TAKEN-001",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Barcode already exists");
    });
  });
});
