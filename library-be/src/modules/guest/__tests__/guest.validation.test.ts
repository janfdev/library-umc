import { describe, expect, it } from "vitest";
import {
  createGuestSchema,
  updateGuestSchema,
} from "../validation/guest.validation";

describe("Guest Validation Schema", () => {
  it("menerima payload create guest yang valid", () => {
    const result = createGuestSchema.safeParse({
      name: "Budi Santoso",
      identifier: "22010001",
      email: "budi@example.com",
      faculty: "Teknik",
      major: "Informatika",
    });

    expect(result.success).toBe(true);
  });

  it("menolak create guest jika name terlalu pendek", () => {
    const result = createGuestSchema.safeParse({
      name: "Ab",
      identifier: "22010001",
    });

    expect(result.success).toBe(false);
  });

  it("mengizinkan update partial guest", () => {
    const result = updateGuestSchema.safeParse({
      major: "Sistem Informasi",
    });

    expect(result.success).toBe(true);
  });
});
