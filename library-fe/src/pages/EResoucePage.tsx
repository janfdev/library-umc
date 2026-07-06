// src/pages/EResourcePage.tsx
import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Download,
  ChevronDown,
  FileText,
  RotateCcw,
  X,
  Calendar,
  Filter,
  BookOpen,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// --- Tipe Data ---
interface RepositoryItem {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  department: string;
  faculty: string;
  abstract: string;
  date: string;
  fileSize: string;
  fileType: string;
  downloads: number;
  views: number;
  category: string;
  year: string;
  keywords: string[];
}

// --- Mock Data yang Lebih Beragam ---
const mockRepositoryData: RepositoryItem[] = [
  {
    id: "1",
    title:
      "Implementasi Algoritma Deep Learning untuk Deteksi Penyakit Tanaman Padi",
    author: "Ahmad Fauzi",
    authorId: "202151001",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract:
      "Penelitian ini mengembangkan model deteksi penyakit tanaman padi menggunakan Convolutional Neural Network (CNN) dengan akurasi mencapai 95.7% pada dataset citra daun padi.",
    date: "12 Januari 2026",
    fileSize: "2.4 MB",
    fileType: "Skripsi",
    downloads: 245,
    views: 1234,
    category: "Skripsi",
    year: "2026",
    keywords: ["deep learning", "cnn", "tanaman padi", "deteksi penyakit"],
  },
  {
    id: "2",
    title:
      "Analisis Sentimen Masyarakat terhadap Kebijakan Pendidikan menggunakan Metode Naive Bayes",
    author: "Siti Nurhaliza",
    authorId: "202152002",
    department: "Sistem Informasi",
    faculty: "Fakultas Ilmu Komputer",
    abstract:
      "Penelitian ini menganalisis sentimen masyarakat terhadap kebijakan pendidikan terbaru menggunakan metode klasifikasi Naive Bayes dengan tingkat akurasi 89.3%.",
    date: "15 Februari 2026",
    fileSize: "1.8 MB",
    fileType: "Jurnal",
    downloads: 189,
    views: 956,
    category: "Jurnal",
    year: "2026",
    keywords: ["sentimen analisis", "naive bayes", "kebijakan pendidikan"],
  },
  {
    id: "3",
    title:
      "Rancang Bangun Aplikasi E-Learning berbasis Mobile untuk Sekolah Dasar",
    author: "Budi Santoso",
    authorId: "202153003",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract:
      "Aplikasi e-learning dikembangkan menggunakan framework Flutter dengan fitur interaktif untuk memfasilitasi pembelajaran jarak jauh bagi siswa sekolah dasar.",
    date: "20 Maret 2026",
    fileSize: "3.1 MB",
    fileType: "Skripsi",
    downloads: 312,
    views: 1876,
    category: "Skripsi",
    year: "2026",
    keywords: ["e-learning", "mobile", "flutter", "sekolah dasar"],
  },
  {
    id: "4",
    title:
      "Pengaruh Penggunaan Media Sosial terhadap Prestasi Belajar Mahasiswa",
    author: "Dewi Lestari",
    authorId: "202154004",
    department: "Pendidikan",
    faculty: "Fakultas Keguruan",
    abstract:
      "Studi kuantitatif ini menginvestigasi dampak penggunaan media sosial terhadap prestasi akademik mahasiswa dengan sampel 300 responden dari 5 universitas.",
    date: "5 April 2026",
    fileSize: "2.1 MB",
    fileType: "Tesis",
    downloads: 156,
    views: 745,
    category: "Tesis",
    year: "2026",
    keywords: ["media sosial", "prestasi belajar", "mahasiswa"],
  },
  {
    id: "5",
    title:
      "Optimasi Jaringan Syaraf Tiruan untuk Prediksi Cuaca di Wilayah Cirebon",
    author: "Rizki Ramadhan",
    authorId: "202155005",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract:
      "Penelitian ini mengoptimalkan algoritma neural network untuk memprediksi pola cuaca dengan akurasi 92% menggunakan data historis 10 tahun terakhir.",
    date: "18 Mei 2025",
    fileSize: "2.7 MB",
    fileType: "Jurnal",
    downloads: 98,
    views: 432,
    category: "Jurnal",
    year: "2025",
    keywords: ["neural network", "prediksi cuaca", "optimasi"],
  },
  {
    id: "6",
    title:
      "Sistem Pendukung Keputusan Pemilihan Program Studi menggunakan Metode AHP",
    author: "Maya Sari",
    authorId: "202156006",
    department: "Sistem Informasi",
    faculty: "Fakultas Ilmu Komputer",
    abstract:
      "Sistem pendukung keputusan berbasis web dikembangkan untuk membantu calon mahasiswa memilih program studi sesuai minat dan bakat menggunakan metode AHP.",
    date: "22 Juni 2025",
    fileSize: "2.9 MB",
    fileType: "Skripsi",
    downloads: 201,
    views: 1023,
    category: "Skripsi",
    year: "2025",
    keywords: ["spk", "ahp", "pemilihan prodi"],
  },
  {
    id: "7",
    title:
      "Analisis Perbandingan Algoritma Machine Learning untuk Klasifikasi Berita Hoax",
    author: "Fajar Hidayat",
    authorId: "202157007",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract:
      "Penelitian membandingkan algoritma SVM, Random Forest, dan Neural Network untuk mendeteksi berita hoax dengan dataset 5000 berita berbahasa Indonesia.",
    date: "10 Juli 2025",
    fileSize: "2.2 MB",
    fileType: "Jurnal",
    downloads: 267,
    views: 1567,
    category: "Jurnal",
    year: "2025",
    keywords: ["machine learning", "hoax detection", "klasifikasi"],
  },
  {
    id: "8",
    title:
      "Pengembangan Media Pembelajaran Interaktif berbasis Augmented Reality",
    author: "Rina Wati",
    authorId: "202158008",
    department: "Pendidikan",
    faculty: "Fakultas Keguruan",
    abstract:
      "Media pembelajaran berbasis AR dikembangkan untuk materi sistem tata surya dengan hasil uji kelayakan 88% dari ahli media dan 92% dari siswa.",
    date: "5 Agustus 2024",
    fileSize: "4.2 MB",
    fileType: "Tesis",
    downloads: 178,
    views: 890,
    category: "Tesis",
    year: "2024",
    keywords: ["augmented reality", "media pembelajaran", "interaktif"],
  },
];

// Data untuk filter dropdown
const categoryOptions = [
  { value: "Semua Kategori", label: "Semua Kategori" },
  { value: "Skripsi", label: "Skripsi" },
  { value: "Tesis", label: "Tesis" },
  { value: "Jurnal", label: "Jurnal" },
  { value: "Disertasi", label: "Disertasi" },
];

const facultyOptions = [
  { value: "Semua Fakultas", label: "Semua Fakultas" },
  { value: "Fakultas Teknik", label: "Fakultas Teknik" },
  { value: "Fakultas Ilmu Komputer", label: "Fakultas Ilmu Komputer" },
  { value: "Fakultas Keguruan", label: "Fakultas Keguruan" },
  { value: "Fakultas Ekonomi", label: "Fakultas Ekonomi" },
  { value: "Fakultas Hukum", label: "Fakultas Hukum" },
];

export default function EResourcePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "author" | "all">(
    "all",
  );
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [selectedFaculty, setSelectedFaculty] = useState("Semua Fakultas");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "downloads" | "views">("date");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedFaculty,
    yearStart,
    yearEnd,
    searchType,
    sortBy,
  ]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown')) {
        setIsCategoryDropdownOpen(false);
      }
      if (!target.closest('.faculty-dropdown')) {
        setIsFacultyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hitung counts untuk setiap kategori
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categoryOptions.forEach(opt => {
      if (opt.value === "Semua Kategori") {
        counts[opt.value] = mockRepositoryData.length;
      } else {
        counts[opt.value] = mockRepositoryData.filter(
          (item) => item.category === opt.value
        ).length;
      }
    });
    return counts;
  }, []);

  // Filter items berdasarkan kriteria
  const filteredItems = useMemo(() => {
    return mockRepositoryData
      .filter((item) => {
        // Filter pencarian
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          switch (searchType) {
            case "title":
              return item.title.toLowerCase().includes(query);
            case "author":
              return item.author.toLowerCase().includes(query);
            case "all":
            default:
              return (
                item.title.toLowerCase().includes(query) ||
                item.author.toLowerCase().includes(query) ||
                item.abstract.toLowerCase().includes(query) ||
                item.keywords.some((k) => k.toLowerCase().includes(query))
              );
          }
        }
        return true;
      })
      .filter((item) => {
        // Filter kategori
        if (selectedCategory !== "Semua Kategori") {
          return item.category === selectedCategory;
        }
        return true;
      })
      .filter((item) => {
        // Filter fakultas
        if (selectedFaculty !== "Semua Fakultas") {
          return item.faculty === selectedFaculty;
        }
        return true;
      })
      .filter((item) => {
        // Filter tahun
        const year = parseInt(item.year);
        const start = yearStart ? parseInt(yearStart) : -Infinity;
        const end = yearEnd ? parseInt(yearEnd) : Infinity;
        return year >= start && year <= end;
      })
      .sort((a, b) => {
        // Sorting
        switch (sortBy) {
          case "downloads":
            return b.downloads - a.downloads;
          case "views":
            return b.views - a.views;
          case "date":
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [
    searchQuery,
    searchType,
    selectedCategory,
    selectedFaculty,
    yearStart,
    yearEnd,
    sortBy,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSearchType("all");
    setSelectedCategory("Semua Kategori");
    setSelectedFaculty("Semua Fakultas");
    setYearStart("");
    setYearEnd("");
    setSortBy("date");
  };

  // Get category badge style
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Skripsi":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Tesis":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Jurnal":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="bg-gradient-to-r from-primary to-primary/90 pt-20 pb-28 px-4 relative">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Repositori Digital UMC
            </h1>
            <p className="text-white/80 text-base md:text-lg font-medium mb-12">
              Akses karya ilmiah, skripsi, tesis, dan jurnal publikasi civitas
              akademika
            </p>

            {/* --- SEARCH BAR (Floating) --- */}
            <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 w-full max-w-4xl px-4">
              <div className="bg-card flex items-center rounded-2xl shadow-lg p-1.5 border border-border">
                <div className="flex-1 flex items-center px-4">
                  <Search className="text-muted-foreground w-5 h-5 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3.5 text-foreground focus:outline-none font-medium text-base"
                    placeholder="Cari judul, penulis, atau kata kunci..."
                  />
                </div>

                {/* Search Type Dropdown */}
                <div className="relative group">
                  <button className="hidden md:flex items-center px-6 border-l border-border text-muted-foreground text-sm gap-2 font-medium hover:text-primary transition-colors">
                    {searchType === "all" && "Semua"}
                    {searchType === "title" && "Judul"}
                    {searchType === "author" && "Penulis"}
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 bg-card rounded-xl shadow-lg border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {[
                      { value: "all", label: "Semua" },
                      { value: "title", label: "Judul" },
                      { value: "author", label: "Penulis" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSearchType(type.value as any)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${
                          searchType === type.value
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all ml-2">
                  Cari
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- MAIN CONTENT AREA --- */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-20">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="lg:hidden w-full mb-6 flex items-center justify-between px-5 py-3 bg-card border border-border rounded-xl shadow-sm"
          >
            <span className="font-medium text-foreground">Filter Pencarian</span>
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* --- SIDEBAR FILTER (Dropdown version) --- */}
            <aside
              className={`
              lg:w-72 flex-shrink-0
              ${showMobileFilter ? "block" : "hidden lg:block"}
            `}
            >
              <div className="sticky top-24 bg-card rounded-2xl border border-border shadow-sm p-5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wide flex items-center gap-2">
                    <Filter size={16} />
                    Filter
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-primary hover:text-primary/90 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                </div>

                {/* Kategori Dropdown Filter */}
                <div className="mb-6 category-dropdown">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Kategori
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm hover:border-primary/40 transition-colors"
                    >
                      <span>{selectedCategory}</span>
                      <ChevronDown size={16} className={`transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-auto">
                        {categoryOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedCategory(option.value);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex justify-between items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                              selectedCategory === option.value ? 'bg-red-50 text-primary' : 'text-foreground'
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{categoryCounts[option.value] || 0}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fakultas Dropdown Filter */}
                <div className="mb-6 faculty-dropdown">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Fakultas
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setIsFacultyDropdownOpen(!isFacultyDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm hover:border-primary/40 transition-colors"
                    >
                      <span>{selectedFaculty}</span>
                      <ChevronDown size={16} className={`transition-transform ${isFacultyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isFacultyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-auto">
                        {facultyOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedFaculty(option.value);
                              setIsFacultyDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                              selectedFaculty === option.value ? 'bg-red-50 text-primary' : 'text-foreground'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tahun Terbit */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Tahun Terbit
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={yearStart}
                        onChange={(e) => setYearStart(e.target.value)}
                        placeholder="Dari"
                        className="w-full bg-card text-foreground border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={yearEnd}
                        onChange={(e) => setYearEnd(e.target.value)}
                        placeholder="Sampai"
                        className="w-full bg-card text-foreground border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(searchQuery ||
                  selectedCategory !== "Semua Kategori" ||
                  selectedFaculty !== "Semua Fakultas" ||
                  yearStart ||
                  yearEnd) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-1.5">
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs">
                          "{searchQuery.slice(0, 15)}"
                          <X size={10} className="cursor-pointer" onClick={() => setSearchQuery("")} />
                        </span>
                      )}
                      {selectedCategory !== "Semua Kategori" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs">
                          {selectedCategory}
                          <X size={10} className="cursor-pointer" onClick={() => setSelectedCategory("Semua Kategori")} />
                        </span>
                      )}
                      {selectedFaculty !== "Semua Fakultas" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs">
                          {selectedFaculty}
                          <X size={10} className="cursor-pointer" onClick={() => setSelectedFaculty("Semua Fakultas")} />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* --- RESULTS LIST --- */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">
                    Hasil Pencarian
                  </h2>
                  <span className="bg-red-100 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    {filteredItems.length} dokumen
                  </span>
                </div>

                {/* Sorting */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-xs">Urutkan:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground focus:outline-none focus:border-primary/60"
                  >
                    <option value="date">Terbaru</option>
                    <option value="downloads">Terpopuler</option>
                    <option value="views">Terbanyak dilihat</option>
                  </select>
                </div>
              </div>

              {/* Results Grid - Card Layout yang lebih natural */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedItems.length === 0 ? (
                  <div className="col-span-full bg-card border border-border rounded-2xl p-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Tidak ada hasil
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Tidak ditemukan karya ilmiah yang sesuai dengan kriteria pencarian Anda.
                    </p>
                  </div>
                ) : (
                  paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryStyle(item.category)}`}>
                            {item.category}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye size={14} />
                            <span>{item.views}</span>
                            <Download size={14} className="ml-1" />
                            <span>{item.downloads}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-foreground leading-tight mb-2 line-clamp-2 hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1.5">
                            <User size={14} />
                            <span>{item.author}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={14} />
                            <span className="text-xs">{item.faculty}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body - Abstract */}
                      <div className="px-5 py-2">
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                          {item.abstract}
                        </p>
                      </div>

                      {/* Keywords */}
                      <div className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                          {item.keywords.length > 3 && (
                            <span className="px-2 py-0.5 text-muted-foreground text-xs">
                              +{item.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 py-4 border-t border-border mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          <span>{item.date}</span>
                          <span className="mx-1">•</span>
                          <span>{item.fileSize}</span>
                        </div>
                        <button className="flex items-center gap-1.5 bg-red-50 text-primary px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-all">
                          <Download size={14} />
                          PDF
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${
                              currentPage === page
                                ? "bg-primary text-white shadow-sm"
                                : "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="text-muted-foreground px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}