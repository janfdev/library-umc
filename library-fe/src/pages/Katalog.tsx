// src/pages/Katalog.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import BookList from "@/components/BookList";
import Background from "@/assets/bg-new.jpeg";
import { Search, RotateCcw, Filter, X } from "lucide-react";
import { authClient } from "@/utils/auth-client";

const Katalog = () => {
  // Search parameters from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user ? {
    id: session.user.id,
    name: session.user.name ?? undefined,
    email: session.user.email,
    role: (session?.user as any)?.role ?? "member"
  } : null;

  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [searchType, setSearchType] = useState(
    searchParams.get("type") || "all",
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState({ start: "", end: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setSearchType(searchParams.get("type") || "all");
  }, [searchParams]);

  // Handle Search
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }
    params.set("type", searchType);
    setSearchParams(params);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchType("all");
    setAvailabilityFilter([]);
    setYearRange({ start: "", end: "" });
    setSearchParams({});
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.length > 0 ||
    availabilityFilter.length > 0 ||
    yearRange.start ||
    yearRange.end;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Search Section */}
      <div
        className="relative w-full flex flex-col justify-center items-center px-4 md:px-8 py-16 md:py-24"
        style={{
          backgroundImage: `linear-gradient(rgba(180, 0, 0, 0.75), rgba(180, 0, 0, 0.85)), url(${Background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-4xl w-full text-center space-y-6">
          <h1 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight">
            Telusuri Koleksi <span className="text-yellow-400">Perpustakaan</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto px-4">
            Temukan ribuan koleksi buku fisik dan digital terbaik Universitas Muhammadiyah Cirebon untuk mendukung kegiatan akademik Anda.
          </p>

          <div className="bg-white rounded-2xl md:rounded-full p-1.5 shadow-2xl flex flex-col md:flex-row items-center gap-1 md:gap-0 mt-8 mx-2 sm:mx-0">
            <div className="flex items-center grow w-full px-5 gap-3">
              <Search className="text-gray-400 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Cari Judul, Penulis, atau ISBN..."
                className="w-full py-4 md:py-3.5 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm md:text-base"
              />
            </div>

            <div className="hidden md:block w-[1px] h-8 bg-gray-200 mx-2"></div>

            <div className="w-full md:w-auto px-2 md:px-0">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full md:w-auto bg-transparent px-5 py-4 md:py-3.5 text-gray-600 outline-none cursor-pointer text-sm font-medium border-t md:border-t-0 border-gray-100"
              >
                <option value="all">Semua Kategori</option>
                <option value="title">Judul</option>
                <option value="author">Penulis</option>
                <option value="isbn">ISBN</option>
              </select>
            </div>

            <div className="w-full md:w-auto p-1 md:p-0">
              <button
                onClick={handleSearch}
                className="w-full md:w-auto bg-[#9a1b1b] hover:bg-[#7a1515] text-white px-8 py-4 md:py-3.5 rounded-xl md:rounded-full font-bold transition-all active:scale-95 shadow-lg"
              >
                Cari Koleksi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Filter & Hasil */}
      <main className="max-w-7xl mx-auto py-8 px-4 md:px-8 grow w-full">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <div className="text-sm font-medium text-gray-500">
            {hasActiveFilters ? "Filter aktif diterapkan" : "Menampilkan semua koleksi"}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 shadow-sm active:scale-95 transition-all"
          >
            <Filter className="w-4 h-4 text-[#9a1b1b]" /> Filter
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter (Kiri) */}
          <aside className={`
            fixed inset-0 z-[60] lg:relative lg:inset-auto lg:z-0 lg:w-1/4 
            transition-transform duration-300 ease-in-out lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/60 lg:hidden backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            <div className="relative bg-white h-full lg:h-auto p-6 rounded-none lg:rounded-2xl shadow-2xl lg:shadow-sm border-r lg:border border-gray-100 overflow-y-auto w-[280px] sm:w-[320px] lg:w-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#9a1b1b]" /> Filter Pencarian
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Reset Button */}
                <button
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wider transition-all border ${
                    !hasActiveFilters 
                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                    : "bg-red-50 text-[#9a1b1b] border-red-100 hover:bg-red-100"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Semua Filter
                </button>

                {/* Filter: Ketersediaan */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Ketersediaan
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 group cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={availabilityFilter.includes("available")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAvailabilityFilter([...availabilityFilter, "available"]);
                            } else {
                              setAvailabilityFilter(availabilityFilter.filter((f) => f !== "available"));
                            }
                          }}
                          className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-[#9a1b1b] checked:border-[#9a1b1b] transition-all"
                        />
                        <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Tersedia Sekarang</span>
                    </label>
                    <label className="flex items-center gap-3 group cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={availabilityFilter.includes("borrowed")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAvailabilityFilter([...availabilityFilter, "borrowed"]);
                            } else {
                              setAvailabilityFilter(availabilityFilter.filter((f) => f !== "borrowed"));
                            }
                          }}
                          className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-[#9a1b1b] checked:border-[#9a1b1b] transition-all"
                        />
                        <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Sedang Dipinjam</span>
                    </label>
                  </div>
                </div>

                {/* Filter: Tahun Terbit */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Tahun Terbit
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase ml-1 tracking-tighter">Mulai</span>
                      <input
                        type="number"
                        value={yearRange.start}
                        onChange={(e) => setYearRange({ ...yearRange, start: e.target.value })}
                        placeholder="1990"
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-[#9a1b1b] transition-all"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase ml-1 tracking-tighter">Sampai</span>
                      <input
                        type="number"
                        value={yearRange.end}
                        onChange={(e) => setYearRange({ ...yearRange, end: e.target.value })}
                        placeholder="2025"
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-[#9a1b1b] transition-all"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Filter Aktif
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {searchQuery && (
                        <span className="px-3 py-1.5 bg-red-50 text-[#9a1b1b] rounded-lg text-[10px] font-bold border border-red-100">
                          "{searchQuery}"
                        </span>
                      )}
                      {availabilityFilter.map((filter) => (
                        <span key={filter} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100">
                          {filter === "available" ? "Tersedia" : "Dipinjam"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* List Hasil (Kanan) */}
          <section className="w-full lg:w-3/4">
            <BookList
              searchQuery={searchQuery}
              searchType={searchType}
              availabilityFilter={availabilityFilter}
              yearRange={yearRange}
              currentUser={currentUser}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Katalog;
