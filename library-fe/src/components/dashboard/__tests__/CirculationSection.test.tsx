import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CirculationSection from "@/components/dashboard/CirculationSection";

vi.mock("@/api/client", () => ({
  API_BASE_URL: "http://localhost:4100",
}));

describe("CirculationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders scan form with default inputs", () => {
    render(<CirculationSection />);
    expect(screen.getByText("Sirkulasi")).toBeInTheDocument();
    expect(screen.getByText("Scan / Lookup Item")).toBeInTheDocument();
  });

  it("shows scan button disabled when input empty", () => {
    render(<CirculationSection />);
    const scanBtn = screen.getByRole("button", { name: /lookup/i });
    expect(scanBtn).toBeDisabled();
  });

  it("enables scan button when input is provided", () => {
    render(<CirculationSection />);
    const input = screen.getByPlaceholderText(/kode item/i);
    fireEvent.change(input, { target: { value: "ITEM-001" } });
    const scanBtn = screen.getByRole("button", { name: /lookup/i });
    expect(scanBtn).not.toBeDisabled();
  });

  it("shows error on failed lookup", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: "Item not found" }),
    });

    render(<CirculationSection />);
    const input = screen.getByPlaceholderText(/kode item/i);
    fireEvent.change(input, { target: { value: "INVALID" } });
    fireEvent.click(screen.getByRole("button", { name: /lookup/i }));

    await waitFor(() => {
      expect(screen.getByText("Item not found")).toBeInTheDocument();
    });
  });

  it("shows Item result after successful lookup", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          item: { id: "1", itemCode: "ITEM-001", title: "Test Book", status: "available", location: "Main" },
          activeLoan: null,
          allowedActions: ["loan"],
        },
      }),
    });

    render(<CirculationSection />);
    const input = screen.getByPlaceholderText(/kode item/i);
    fireEvent.change(input, { target: { value: "ITEM-001" } });
    fireEvent.click(screen.getByRole("button", { name: /lookup/i }));

    await waitFor(() => {
      expect(screen.getByText("ITEM-001")).toBeInTheDocument();
      expect(screen.getByText("Test Book")).toBeInTheDocument();
      expect(screen.getByText("available")).toBeInTheDocument();
    });
  });
});
