import { describe, expect, it } from "vitest";
import {
  sendFinesNotificationSchema,
  sendLoansNotificationSchema,
} from "../validation/notification.validation";

describe("Notification Validation Schema", () => {
  it("menerima payload fines notification valid", () => {
    const result = sendFinesNotificationSchema.safeParse({
      email: "member@example.com",
      name: "Member",
      amount: 1500,
      bookTitle: "Bumi",
    });

    expect(result.success).toBe(true);
  });

  it("menolak fines notification jika amount tidak positif", () => {
    const result = sendFinesNotificationSchema.safeParse({
      email: "member@example.com",
      name: "Member",
      amount: 0,
      bookTitle: "Bumi",
    });

    expect(result.success).toBe(false);
  });

  it("menerima payload loans notification valid", () => {
    const result = sendLoansNotificationSchema.safeParse({
      email: "member@example.com",
      name: "Member",
      bookTitle: "Bumi",
      tanggalPengembalian: "2026-04-01",
    });

    expect(result.success).toBe(true);
  });
});
