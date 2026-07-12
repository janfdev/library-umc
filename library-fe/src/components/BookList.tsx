import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PerspectiveBook } from "./perspective-book";
import { BookOpen } from "lucide-react";
import { useBookList } from "../hooks/useBookList";
import type { Bibliography, LibraryUser } from "../types";
import { generateColorFromSeed } from "@/utils/format";

interface BookListProps {
  searchQuery?: string;
  searchType?: string;
  availabilityFilter?: string[];
  yearRange?: { start: string; end: string };
  currentUser?: LibraryUser | null;
  categoryFilter?: number[];
}

const BookList = ({
  searchQuery = "",
  searchType = "all",
  availabilityFilter = [],
  yearRange = { start: "", end: "" },
  currentUser = null,
  categoryFilter = [],
}: BookListProps) => {
  const navigate = useNavigate();

  // ✅ Semua fetching dipindahkan ke custom hook
  const { bibliographies, userReservations, loading, error } = useBookList(
    currentUser ?? null,
  );
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType, availabilityFilter, yearRange, activeTab, categoryFilter]);

  // Helper: Cek apakah user sedang meminjam buku ini
  const isUserBorrowing = (bibliographyId: string): boolean => {
    return userReservations.some(
      (res) =>
        res.bibliographyId === bibliographyId &&
        (res.status === "fulfilled" || res.status === "waiting"),
    );
  };

  // Helper: Dapatkan status buku (hanya berdasarkan reservasi user sendiri)
  const getBookStatusReservation = (): string => {
    return "available";
  };

  // Filter berdasarkan tab
  const filteredByTab = bibliographies.filter((bibliography) => {
    if (activeTab === 0) {
      return bibliography.type === "physical_book";
    } else {
      return bibliography.type === "ebook";
    }
  });

  // Filter berdasarkan search query
  const filteredBySearch = filteredByTab.filter((bibliography) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    switch (searchType) {
      case "title":
        return bibliography.title.toLowerCase().includes(query);
      case "author":
        return bibliography.author.toLowerCase().includes(query);
      case "isbn":
        return bibliography.isbn?.toLowerCase().includes(query);
      case "subject":
        return bibliography.subjects?.some((s) => s.name.toLowerCase().includes(query)) || false;
      case "all":
      default:
        return (
          bibliography.title.toLowerCase().includes(query) ||
          bibliography.author.toLowerCase().includes(query) ||
          bibliography.isbn?.toLowerCase().includes(query) ||
          bibliography.publisher.toLowerCase().includes(query) ||
          bibliography.subjects?.some((s) => s.name.toLowerCase().includes(query)) || false
        );
    }
  });

  // Filter berdasarkan ketersediaan (dari filter sidebar)
  const filteredByAvailability =
    availabilityFilter.length > 0
      ? filteredBySearch.filter(() => {
          const bookStatus = getBookStatusReservation();
          return availabilityFilter.includes(bookStatus);
        })
      : filteredBySearch;

  // Filter berdasarkan tahun terbit
  const filteredByYear = filteredByAvailability.filter((bibliography) => {
    if (!yearRange.start && !yearRange.end) return true;

    const year = bibliography.publicationYear;
    const start = yearRange.start ? parseInt(yearRange.start) : 0;
    const end = yearRange.end ? parseInt(yearRange.end) : 9999;

    return Number(year) >= Number(start) && Number(year) <= Number(end);
  });

  // Filter berdasarkan kategori/jurusan
  const filteredByCategory = categoryFilter.length > 0
    ? filteredByYear.filter((bibliography) => {
        return categoryFilter.includes(Number(bibliography.categoryId));
      })
    : filteredByYear;

  // Pagination Logic
  const totalItems = filteredByCategory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredByCategory.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper: Status label
  const getStatusLabel = (bibliography: Bibliography) => {
    if (currentUser && isUserBorrowing(bibliography.id)) {
      const reservation = userReservations.find(
        (r) => r.bibliographyId === bibliography.id,
      );
      if (reservation?.status === "waiting") {
        return "Menunggu Konfirmasi";
      } else if (reservation?.status === "fulfilled") {
        return "Sedang Anda Pinjam";
      }
    }
    return "Tersedia";
  };

  // Helper: Status badge style
  const getStatusBadge = (bibliography: Bibliography) => {
    if (currentUser && isUserBorrowing(bibliography.id)) {
      const reservation = userReservations.find(
        (r) => r.bibliographyId === bibliography.id,
      );
      if (reservation?.status === "waiting") {
        return "px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium";
      } else if (reservation?.status === "fulfilled") {
        return "px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium";
      }
    }
    return "px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium";
  };

  // Navigasi ke detail
  const handleBookClick = (bibliographyId: string) => {
    navigate(`/katalog/${bibliographyId}`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data koleksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-primary mb-2">Error</h3>
          <p className="text-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="w-full md:w-auto">
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            Koleksi Perpustakaan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalItems} Buku
          </p>
          {currentUser && (
            <p className="text-xs text-purple-600 mt-1">
              Anda sedang meminjam{" "}
              {userReservations.filter((r) => r.status === "fulfilled").length}{" "}
              buku
              {userReservations.some((r) => r.status === "waiting") &&
                `, ${userReservations.filter((r) => r.status === "waiting").length} menunggu konfirmasi`}
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="hidden md:flex border-b border-border ml-auto">
          {["Buku Fisik", "E-Book"].map((tab, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveTab(index);
                setCurrentPage(1);
              }}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === index
                  ? "text-primary border-b-2 border-primary"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-b border-border mb-6 overflow-x-auto whitespace-nowrap">
        {["Buku Fisik", "E-Book"].map((tab, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveTab(index);
              setCurrentPage(1);
            }}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === index
                ? "text-primary border-b-2 border-primary"
                : "text-foreground hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Book Grid — PerspectiveBook */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6 justify-items-center">
        {currentItems.length === 0 ? (
          <div className="col-span-full text-center py-8 sm:py-12 text-muted-foreground">
            <div className="text-3xl sm:text-4xl mb-4">🔍</div>
            <p className="text-lg font-semibold mb-2">
              Tidak ada hasil ditemukan
            </p>
            <p className="text-sm">
              Coba ubah kata kunci pencarian atau filter lainnya
            </p>
          </div>
        ) : (
          currentItems.map((bibliography) => (
            <div
              key={bibliography.id}
              onClick={() => handleBookClick(bibliography.id)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <PerspectiveBook
                size="sm"
                className={generateColorFromSeed(bibliography.id)}
              >
                <div className="flex flex-col h-full gap-1.5">
                  <p className="font-semibold capitalize leading-4 text-white text-xs line-clamp-3">
                    {bibliography.title}
                  </p>
                  <div className="mt-auto flex flex-col gap-1">
                    <span className="text-white/70 text-[10px] leading-tight line-clamp-1">
                      {bibliography.author}
                    </span>
                    <div className="flex items-center gap-1">
                      <BookOpen className="size-3 text-white/70" />
                      <span className="text-white/60 text-[9px]">
                        {bibliography.publicationYear ?? ""}
                      </span>
                    </div>
                  </div>
                </div>
              </PerspectiveBook>
              {/* Info & status di bawah buku */}
              <div className="text-center max-w-[120px] sm:max-w-[150px]">
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="px-1.5 py-0.5 text-[9px] bg-muted text-muted-foreground rounded">
                    {bibliography.type === "physical_book" ? "Fisik" : "E-Book"}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] rounded ${getStatusBadge(bibliography)}`}
                  >
                    {getStatusLabel(bibliography)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            &lt;
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Hanya tampilkan beberapa halaman jika total halaman banyak
            if (
              totalPages > 7 &&
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(pageNum - currentPage) > 2
            ) {
              if (Math.abs(pageNum - currentPage) === 3) {
                return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
              }
              return null;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  currentPage === pageNum
                    ? "bg-primary text-white shadow-md"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            &gt;
          </button>
        </div>
      )}

      {/* Keterangan status */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Tersedia</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Dipinjam (orang lain)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>Sedang Anda pinjam</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Menunggu konfirmasi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookList;