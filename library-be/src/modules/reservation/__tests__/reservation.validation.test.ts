import { describe, expect, it } from "vitest";
import {
  createReservationSchema,
  getReservationsQuerySchema,
} from "../validation/reservation.validation";

describe("Reservation Validation Schema", () => {
  it("menolak create reservation jika bibliographyId kosong", () => {
    const result = createReservationSchema.safeParse({ bibliographyId: "" });
    expect(result.success).toBe(false);
  });

  it("menerima create reservation jika bibliographyId terisi", () => {
    const result = createReservationSchema.safeParse({
      bibliographyId: "biblio-123",
    });
    expect(result.success).toBe(true);
  });

  it("menerima filter query reservation yang valid", () => {
    const result = getReservationsQuerySchema.safeParse({
      status: "waiting",
      limit: "20",
      offset: "0",
    });
    expect(result.success).toBe(true);
  });

  it("menolak limit query reservation yang bukan angka", () => {
    const result = getReservationsQuerySchema.safeParse({ limit: "x" });
    expect(result.success).toBe(false);
  });
});
