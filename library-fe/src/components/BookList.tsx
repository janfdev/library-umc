import { useState } from "react";
import { useNavigate } from "react-router";
import { PerspectiveBook } from "./perspective-book";
import { BookOpen } from "lucide-react";
import { useBookList } from "../hooks/useBookList";
import type { Collection, LibraryUser } from "../types";
import { generateColorFromSeed } from "@/utils/format";

interface BookListProps {
  searchQuery?: string;
  searchType?: string;
  availabilityFilter?: string[];
  yearRange?: { start: string; end: string };
  currentUser?: LibraryUser | null;
}

const BookList = ({
  searchQuery = "",
  searchType = "all",
  availabilityFilter = [],
  yearRange = { start: "", end: "" },
  currentUser = null,
}: BookListProps) => {
  const navigate = useNavigate();

  // ✅ Semua fetching dipindahkan ke custom hook
  const { collections, userReservations, loading, error } = useBookList(
    currentUser ?? null,
  );
  const [activeTab, setActiveTab] = useState(0);

  // Helper: Cek apakah user sedang meminjam buku ini
  const isUserBorrowing = (collectionId: string): boolean => {
    return userReservations.some(
      (res) =>
        res.collectionId === collectionId &&
        (res.status === "fulfilled" || res.status === "waiting"),
    );
  };

  // Helper: Dapatkan status buku (hanya berdasarkan reservasi user sendiri)
  const getBookStatusReservation = (): string => {
    return "available";
  };

  // Filter berdasarkan tab
  const filteredByTab = collections.filter((collection) => {
    if (activeTab === 0) {
      return collection.type === "physical_book";
    } else {
      return collection.type === "ebook";
    }
  });

  // Filter berdasarkan search query
  const filteredBySearch = filteredByTab.filter((collection) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    switch (searchType) {
      case "title":
        return collection.title.toLowerCase().includes(query);
      case "author":
        return collection.author.toLowerCase().includes(query);
      case "isbn":
        return collection.isbn?.toLowerCase().includes(query);
      case "all":
      default:
        return (
          collection.title.toLowerCase().includes(query) ||
          collection.author.toLowerCase().includes(query) ||
          collection.isbn?.toLowerCase().includes(query) ||
          collection.publisher.toLowerCase().includes(query)
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
  const filteredByYear = filteredByAvailability.filter((collection) => {
    if (!yearRange.start && !yearRange.end) return true;

    const year = collection.publicationYear;
    const start = yearRange.start ? parseInt(yearRange.start) : 0;
    const end = yearRange.end ? parseInt(yearRange.end) : 9999;

    return Number(year) >= Number(start) && Number(year) <= Number(end);
  });

  // Helper: Status label
  const getStatusLabel = (collection: Collection) => {
    if (currentUser && isUserBorrowing(collection.id)) {
      const reservation = userReservations.find(
        (r) => r.collectionId === collection.id,
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
  const getStatusBadge = (collection: Collection) => {
    if (currentUser && isUserBorrowing(collection.id)) {
      const reservation = userReservations.find(
        (r) => r.collectionId === collection.id,
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
  const handleBookClick = (collectionId: string) => {
    navigate(`/katalog/${collectionId}`);
  };

  if (loading) {
    return (
      <div className="w-[800px] bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data koleksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[800px] bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
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
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Koleksi Perpustakaan
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredByYear.length} Buku
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
        <div className="hidden md:flex border-b border-gray-200 ml-auto">
          {["Buku Fisik", "E-Book"].map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === index
                  ? "text-red-700 border-b-2 border-red-700"
                  : "text-gray-700 hover:text-red-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-b border-gray-200 mb-6">
        {["Buku Fisik", "E-Book"].map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === index
                ? "text-red-700 border-b-2 border-red-700"
                : "text-gray-700 hover:text-red-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Book Grid — PerspectiveBook */}
      <div className="flex flex-wrap gap-6 justify-start">
        {filteredByYear.length === 0 ? (
          <div className="w-full text-center py-8 sm:py-12 text-gray-500">
            <div className="text-3xl sm:text-4xl mb-4">🔍</div>
            <p className="text-lg font-semibold mb-2">
              Tidak ada hasil ditemukan
            </p>
            <p className="text-sm">
              Coba ubah kata kunci pencarian atau filter lainnya
            </p>
          </div>
        ) : (
          filteredByYear.map((collection) => (
            <div
              key={collection.id}
              onClick={() => handleBookClick(collection.id)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <PerspectiveBook
                size="sm"
                className={generateColorFromSeed(collection.id)}
              >
                <div className="flex flex-col h-full gap-1.5">
                  <p className="font-semibold capitalize leading-4 text-white text-xs line-clamp-3">
                    {collection.title}
                  </p>
                  <div className="mt-auto flex flex-col gap-1">
                    <span className="text-white/70 text-[10px] leading-tight line-clamp-1">
                      {collection.author}
                    </span>
                    <div className="flex items-center gap-1">
                      <BookOpen className="size-3 text-white/70" />
                      <span className="text-white/60 text-[9px]">
                        {collection.publicationYear ?? ""}
                      </span>
                    </div>
                  </div>
                </div>
              </PerspectiveBook>
              {/* Info & status di bawah buku */}
              <div className="text-center w-[150px]">
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-600 rounded">
                    {collection.type === "physical_book" ? "Fisik" : "E-Book"}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] rounded ${getStatusBadge(collection)}`}
                  >
                    {getStatusLabel(collection)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keterangan status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
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
