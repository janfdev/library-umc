import { describe, expect, it } from "vitest";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../validation/collection.validation";

describe("Collection Validation Schema", () => {
  const validPayload = {
    title: "Pemrograman Backend",
    author: "John Doe",
    publisher: "Tech Press",
    publicationYear: "2026",
    type: "physical_book",
    categoryId: "1",
    stock: "3",
  };

  it("mengubah categoryId dan stock string menjadi number", () => {
    const result = createCollectionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.categoryId).toBe(1);
      expect(result.data.stock).toBe(3);
    }
  });

  it("menolak publicationYear yang bukan format YYYY", () => {
    const result = createCollectionSchema.safeParse({
      ...validPayload,
      publicationYear: "26",
    });
    expect(result.success).toBe(false);
  });

  it("mengizinkan update partial data", () => {
    const result = updateCollectionSchema.safeParse({
      title: "Judul Baru",
    });
    expect(result.success).toBe(true);
  });
});
