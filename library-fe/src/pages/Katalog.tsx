// src/pages/Katalog.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import BookList from "@/components/BookList";
import Background from "@/assets/bg-new.jpeg";
import { Search, RotateCcw } from "lucide-react";

const Katalog = () => {
  // Search parameters from URL
  const [searchParams] = useSearchParams();

  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [searchType, setSearchType] = useState(
    searchParams.get("type") || "all",
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState({ start: "", end: "" });

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setSearchType(searchParams.get("type") || "all");
  }, [searchParams]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchType("all");
    setAvailabilityFilter([]);
    setYearRange({ start: "", end: "" });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.length > 0 ||
    availabilityFilter.length > 0 ||
    yearRange.start ||
    yearRange.end;

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* Hero Search Section */}
      <div
        className="relative w-full flex flex-col justify-center items-center px-4 md:px-8 py-12"
        style={{
          backgroundImage: `linear-gradient(rgba(180, 0, 0, 0.7), rgba(180, 0, 0, 0.7)), url(${Background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="text-white text-2xl md:text-4xl font-bold mb-8 text-center px-2">
          Telusuri Koleksi Perpustakaan
        </h1>

        <div className="w-full max-w-4xl">
          {/* Container Utama: Berubah dari rounded-2xl (mobile) ke rounded-full (desktop) */}
          <div className="bg-white rounded-2xl md:rounded-full p-2 shadow-2xl flex flex-col md:flex-row items-center gap-1 md:gap-0">
            {/* Bagian Input: Mengambil space penuh */}
            <div className="flex items-center grow w-full px-4 md:px-6 gap-3 border-b md:border-b-0 border-gray-100">
              <Search className="text-gray-400 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Judul, Penulis, atau ISBN..."
                className="w-full py-4 md:py-3 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm md:text-base"
              />
            </div>

            {/* Divider: Hanya muncul di Desktop */}
            <div className="hidden md:block w-[1px] h-8 bg-gray-200 mx-2"></div>

            {/* Dropdown: Full width di mobile, auto di desktop */}
            <div className="w-full md:w-auto px-2 md:px-0">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full md:w-auto bg-transparent px-4 py-3 text-gray-600 outline-none cursor-pointer text-sm font-medium"
              >
                <option value="all">Semua</option>
                <option value="title">Judul</option>
                <option value="author">Penulis</option>
                <option value="isbn">ISBN</option>
              </select>
            </div>

            {/* Tombol: Full width di mobile dengan rounded yang menyesuaikan */}
            <div className="w-full md:w-auto p-1 md:p-0">
              <button
                onClick={() => {
                  console.log("Searching:", searchQuery, "Type:", searchType);
                }}
                className="w-full md:w-auto bg-[#9a1b1b] hover:bg-[#7a1515] text-white px-10 py-3.5 rounded-xl md:rounded-full font-bold transition-all active:scale-95"
              >
                Cari
              </button>
            </div>
          </div>

          {/* Info Pencarian - Hanya muncul saat ada query */}
          {searchQuery && (
            <p className="text-white text-center mt-5 text-xs md:text-sm italic opacity-90 px-4">
              Menampilkan hasil untuk :{" "}
              <span className="font-bold underline">"{searchQuery}"</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content: Filter & Hasil */}
      <main className="max-w-7xl mx-auto py-10 px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter (Kiri) */}
          <aside className="w-full lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800">Filter Pencarian</h2>
                <button
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className={`text-red-600 text-xs font-bold flex items-center gap-1 uppercase tracking-wider ${
                    !hasActiveFilters ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Filter: Ketersediaan */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">
                  Ketersediaan
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availabilityFilter.includes("available")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAvailabilityFilter([
                            ...availabilityFilter,
                            "available",
                          ]);
                        } else {
                          setAvailabilityFilter(
                            availabilityFilter.filter((f) => f !== "available"),
                          );
                        }
                      }}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    Tersedia
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availabilityFilter.includes("borrowed")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAvailabilityFilter([
                            ...availabilityFilter,
                            "borrowed",
                          ]);
                        } else {
                          setAvailabilityFilter(
                            availabilityFilter.filter((f) => f !== "borrowed"),
                          );
                        }
                      }}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    Dipinjam
                  </label>
                </div>
              </div>

              {/* Filter: Tahun Terbit */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">
                  Tahun Terbit
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={yearRange.start}
                    onChange={(e) =>
                      setYearRange({ ...yearRange, start: e.target.value })
                    }
                    placeholder="Mulai"
                    className="w-1/2 p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
                    min="1000"
                    max={new Date().getFullYear()}
                  />
                  <input
                    type="number"
                    value={yearRange.end}
                    onChange={(e) =>
                      setYearRange({ ...yearRange, end: e.target.value })
                    }
                    placeholder="Akhir"
                    className="w-1/2 p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
                    min="1000"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              {/* Active Filters Badge */}
              {hasActiveFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">
                    Filter Aktif
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        "{searchQuery}"
                      </span>
                    )}
                    {availabilityFilter.map((filter) => (
                      <span
                        key={filter}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                      >
                        {filter === "available" ? "Tersedia" : "Dipinjam"}
                      </span>
                    ))}
                    {(yearRange.start || yearRange.end) && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {yearRange.start || "?"} - {yearRange.end || "?"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* List Hasil (Kanan) */}
          <section className="w-full lg:w-3/4">
            {/* Memanggil Komponen BookList dengan props */}
            <BookList
              searchQuery={searchQuery}
              searchType={searchType}
              availabilityFilter={availabilityFilter}
              yearRange={yearRange}
            />

            {/* Pagination Placeholder */}
            <div className="flex justify-center items-center gap-2 mt-10">
              <button className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                {" "}
                &lt;{" "}
              </button>
              <button className="w-10 h-10 bg-[#9a1b1b] text-white rounded-lg font-bold shadow-md">
                1
              </button>
              <button className="w-10 h-10 hover:bg-gray-200 rounded-lg">
                2
              </button>
              <button className="w-10 h-10 hover:bg-gray-200 rounded-lg">
                3
              </button>
              <span className="px-2">....</span>
              <button className="w-10 h-10 hover:bg-gray-200 rounded-lg">
                6
              </button>
              <button className="p-2 border rounded-lg hover:bg-gray-100">
                {" "}
                &gt;{" "}
              </button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Katalog;
