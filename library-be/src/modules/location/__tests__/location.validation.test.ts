import { describe, expect, it } from "vitest";
import {
  createLocationSchema,
  updateLocationSchema,
} from "../validation/location.validation";

describe("Location Validation Schema", () => {
  it("menerima create location yang valid", () => {
    const result = createLocationSchema.safeParse({
      room: "Ruang A",
      rack: "Rak 1",
      shelf: "Shelf 3",
    });

    expect(result.success).toBe(true);
  });

  it("menolak room kosong", () => {
    const result = createLocationSchema.safeParse({
      room: "",
      rack: "Rak 1",
      shelf: "Shelf 3",
    });

    expect(result.success).toBe(false);
  });

  it("menerima update partial location", () => {
    const result = updateLocationSchema.safeParse({
      shelf: "Shelf 4",
    });

    expect(result.success).toBe(true);
  });
});
