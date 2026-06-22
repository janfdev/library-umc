import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BibliographySection from "@/components/dashboard/BibliographySection";

// Mock the API client
vi.mock("@/api/client", () => ({
  bibliographyApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { bibliographyApi } from "@/api/client";

const mockBibliographies = {
  items: [
    {
      id: "1",
      title: "Test Book",
      isbnIssn: "978-0-123456-78-9",
      edition: "1st",
      publishYear: 2024,
      stock: 5,
      authors: [{ id: 1, name: "John Doe", role: "primary", position: 1 }],
      subjects: [{ id: 1, name: "Programming" }],
      totalItems: 5,
      availableItems: 3,
      publisher: { id: 1, name: "Test Publisher" },
    },
    {
      id: "2",
      title: "Another Book",
      isbnIssn: "",
      publishYear: 2023,
      stock: 2,
      authors: [],
      subjects: [],
      totalItems: 2,
      availableItems: 2,
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe("BibliographySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bibliographyApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockBibliographies,
    });
  });

  it("should render bibliography list", async () => {
    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Test Book")).toBeInTheDocument();
      expect(screen.getByText("Another Book")).toBeInTheDocument();
    });
  });

  it("should display author names", async () => {
    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("should display publisher name", async () => {
    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Test Publisher")).toBeInTheDocument();
    });
  });

  it("should display stock information", async () => {
    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("3/5")).toBeInTheDocument();
    });
  });

  it("should show empty state when no data", async () => {
    (bibliographyApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    });

    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Belum ada bibliografi")).toBeInTheDocument();
    });
  });

  it("should show search results empty state", async () => {
    (bibliographyApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    });

    render(<BibliographySection searchTerm="nonexistent" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Tidak ada hasil")).toBeInTheDocument();
    });
  });

  it("should show error state when API fails", async () => {
    (bibliographyApi.list as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should have add button", async () => {
    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Tambah")).toBeInTheDocument();
    });
  });

  it("should have search input", async () => {
    render(<BibliographySection searchTerm="" onSearchChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Cari bibliografi...")).toBeInTheDocument();
    });
  });
});
