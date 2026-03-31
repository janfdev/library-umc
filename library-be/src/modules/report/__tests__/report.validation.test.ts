import { describe, expect, it } from "vitest";
import {
  exportFinesQuerySchema,
  exportLoansQuerySchema,
  finesRevenueSummaryQuerySchema,
  getPopularBooksQuerySchema,
} from "../validation/report.validation";

describe("Report Validation Schema", () => {
  it("menerima query popular books yang valid", () => {
    const result = getPopularBooksQuerySchema.safeParse({ limit: "10" });
    expect(result.success).toBe(true);
  });

  it("menolak limit popular books yang bukan angka", () => {
    const result = getPopularBooksQuerySchema.safeParse({ limit: "abc" });
    expect(result.success).toBe(false);
  });

  it("memberi default format csv untuk export loans", () => {
    const result = exportLoansQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("csv");
    }
  });

  it("menolak month di luar range 1-12 untuk export fines", () => {
    const result = exportFinesQuerySchema.safeParse({ month: "13" });
    expect(result.success).toBe(false);
  });

  it("menerima month/year valid untuk revenue summary", () => {
    const result = finesRevenueSummaryQuerySchema.safeParse({
      month: "03",
      year: "2026",
    });
    expect(result.success).toBe(true);
  });
});
