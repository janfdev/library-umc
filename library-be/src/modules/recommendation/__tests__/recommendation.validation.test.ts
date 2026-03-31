import { describe, expect, it } from "vitest";
import {
  createRecommendationSchema,
  getRecommendationsQuerySchema,
  updateRecommendationStatusSchema,
} from "../validation/recommendation.validation";

describe("Recommendation Validation Schema", () => {
  it("menerima create recommendation valid", () => {
    const result = createRecommendationSchema.safeParse({
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      publisher: "O'Reilly",
      reason: "Referensi mata kuliah",
    });

    expect(result.success).toBe(true);
  });

  it("menolak status update di luar approved/rejected", () => {
    const result = updateRecommendationStatusSchema.safeParse({
      status: "pending",
    });

    expect(result.success).toBe(false);
  });

  it("menerima query recommendations status valid", () => {
    const result = getRecommendationsQuerySchema.safeParse({
      status: "approved",
    });

    expect(result.success).toBe(true);
  });
});
