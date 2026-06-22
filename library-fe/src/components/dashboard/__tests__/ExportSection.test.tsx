import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ExportSection from "@/components/dashboard/ExportSection";

// Mock the API client
vi.mock("@/api/client", () => ({
  exportApi: {
    downloadBibliographies: vi.fn(),
    downloadItems: vi.fn(),
  },
}));

import { exportApi } from "@/api/client";

describe("ExportSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render export section with title and buttons", () => {
    render(<ExportSection />);

    expect(screen.getByText("Export Data")).toBeInTheDocument();
    expect(screen.getAllByText("Export Bibliografi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Export Item").length).toBeGreaterThan(0);
  });

  it("should show loading state when exporting bibliographies", async () => {
    (exportApi.downloadBibliographies as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ExportSection />);

    const biblioButton = screen.getByRole("button", { name: /Export Bibliografi/i });
    biblioButton.click();

    await waitFor(() => {
      expect(screen.getByText("Mengexport...")).toBeInTheDocument();
    });
  });

  it("should show success state after successful bibliography export", async () => {
    (exportApi.downloadBibliographies as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<ExportSection />);

    const biblioButton = screen.getByRole("button", { name: /Export Bibliografi/i });
    biblioButton.click();

    await waitFor(() => {
      expect(screen.getByText("Berhasil!")).toBeInTheDocument();
    });
  });

  it("should show error state when bibliography export fails", async () => {
    (exportApi.downloadBibliographies as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(<ExportSection />);

    const biblioButton = screen.getByRole("button", { name: /Export Bibliografi/i });
    biblioButton.click();

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should handle item export success", async () => {
    (exportApi.downloadItems as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<ExportSection />);

    const itemButton = screen.getByRole("button", { name: /Export Item/i });
    itemButton.click();

    await waitFor(() => {
      expect(screen.getByText("Berhasil!")).toBeInTheDocument();
    });
  });
});
