import { describe, expect, it } from "vitest";
import {
  createItemSchema,
  itemStatusSchema,
  updateItemSchema,
} from "../validation/item.validation";

describe("Item Validation Schema", () => {
  it("menerima create item yang valid", () => {
    const result = createItemSchema.safeParse({
      bibliographyId: "550e8400-e29b-41d4-a716-446655440000",
      locationId: 1,
      barcode: "BC-001",
      uniqueCode: "UC-001",
      itemCode: "ITEM-001",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("available");
    }
  });

  it("menolak status item yang tidak valid", () => {
    const result = itemStatusSchema.safeParse("ready");
    expect(result.success).toBe(false);
  });

  it("menerima update item partial", () => {
    const result = updateItemSchema.safeParse({
      barcode: "NEW-001",
    });

    expect(result.success).toBe(true);
  });
});
