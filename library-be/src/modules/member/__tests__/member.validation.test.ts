import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "../validation/member.validation";

describe("Member Validation Schema", () => {
  it("menerima update profile yang valid", () => {
    const result = updateProfileSchema.safeParse({
      nimNidn: "22010001",
      faculty: "Teknik",
      phone: "08123456789",
    });

    expect(result.success).toBe(true);
  });

  it("menolak nimNidn terlalu pendek", () => {
    const result = updateProfileSchema.safeParse({
      nimNidn: "123",
    });

    expect(result.success).toBe(false);
  });
});
