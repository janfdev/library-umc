import { describe, expect, it } from "vitest";
import {
  createBibliographySchema,
  updateBibliographySchema,
} from "../validation/bibliography.validation";

describe("Bibliography Validation Schema", () => {
  it("menerima create bibliography valid", () => {
    const result = createBibliographySchema.safeParse({
      title: "Algoritma dan Pemrograman",
      isbnIssn: "ISBN 978-602-8519-93-9",
      publishYear: 2023,
      type: "physical_book",
    });

    expect(result.success).toBe(true);
  });

  it("menolak bibliography tanpa title", () => {
    const result = createBibliographySchema.safeParse({
      isbnIssn: "ISBN 978-602-8519-93-9",
    });

    expect(result.success).toBe(false);
  });

  it("menerima update bibliography partial", () => {
    const result = updateBibliographySchema.safeParse({
      title: "Updated Title",
    });

    expect(result.success).toBe(true);
  });
});
