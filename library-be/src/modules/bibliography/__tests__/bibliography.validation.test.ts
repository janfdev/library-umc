import { describe, expect, it } from "vitest";
import {
  createBibliographySchema,
  updateBibliographySchema,
  bibliographyQuerySchema,
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

  it("menerima facultyIds array", () => {
    const result = createBibliographySchema.safeParse({
      title: "Buku Teknik",
      facultyIds: [1, 2, 3],
    });
    expect(result.success).toBe(true);
    expect(result.data?.facultyIds).toEqual([1, 2, 3]);
  });

  it("menerima studyProgramIds array", () => {
    const result = createBibliographySchema.safeParse({
      title: "Buku Hukum",
      studyProgramIds: [5, 6],
    });
    expect(result.success).toBe(true);
    expect(result.data?.studyProgramIds).toEqual([5, 6]);
  });

  it("menerima facultyId dan studyProgramId di query schema", () => {
    const result = bibliographyQuerySchema.safeParse({
      facultyId: 1,
      studyProgramId: 2,
    });
    expect(result.success).toBe(true);
  });
});
