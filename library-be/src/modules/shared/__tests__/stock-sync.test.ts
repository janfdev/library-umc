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
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
  });

  it("should count items and update stock", async () => {
    await syncCollectionAvailableStock(mockTx, "bib-1");

    expect(mockTx.select).toHaveBeenCalled();
    expect(mockTx.update).toHaveBeenCalled();
  });

  it("should handle zero available items", async () => {
    mockTx.select = vi.fn().mockReturnValue({
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

  it("should set stock to the counted value", async () => {
    mockTx.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 12 }]),
      }),
    });

    await syncCollectionAvailableStock(mockTx, "bib-1");

    const setCall = mockTx.update().set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({ stock: 12 })
    );
  });
});
