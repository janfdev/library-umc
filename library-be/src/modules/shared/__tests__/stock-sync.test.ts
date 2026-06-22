import { describe, expect, it, vi, beforeEach } from "vitest";
import { syncCollectionAvailableStock } from "../utils/stock-sync";

vi.mock("../../../db", () => ({
  db: {},
}));

vi.mock("../../../db/schema", () => ({
  items: Symbol("items"),
  bibliographies: Symbol("bibliographies"),
}));

describe("syncCollectionAvailableStock", () => {
  let mockTx: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([{ id: "bib-1" }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
  });

  it("should lock row FOR UPDATE, count items, and update stock", async () => {
    // Mock the count query (second select call)
    mockTx.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([{ id: "bib-1" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

    await syncCollectionAvailableStock(mockTx, "bib-1");

    expect(mockTx.select).toHaveBeenCalledTimes(2);
    expect(mockTx.update).toHaveBeenCalled();
  });

  it("should throw when bibliography not found", async () => {
    mockTx.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          for: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(
      syncCollectionAvailableStock(mockTx, "nonexistent")
    ).rejects.toThrow("not found for stock lock");
  });

  it("should handle zero available items", async () => {
    mockTx.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([{ id: "bib-1" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

    await syncCollectionAvailableStock(mockTx, "bib-1");

    const setCall = mockTx.update().set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({ stock: 0 })
    );
  });
});
