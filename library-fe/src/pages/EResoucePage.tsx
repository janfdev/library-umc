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
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight
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
    title: "Implementasi Algoritma Deep Learning untuk Deteksi Penyakit Tanaman Padi",
    author: "Ahmad Fauzi",
    authorId: "202151001",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract: "Penelitian ini mengembangkan model deteksi penyakit tanaman padi menggunakan Convolutional Neural Network (CNN) dengan akurasi mencapai 95.7% pada dataset citra daun padi.",
    date: "12 Januari 2026",
    fileSize: "Bab 1",
    fileType: "Skripsi",
    downloads: 245,
    views: 1234,
    category: "Skripsi",
    year: "2026",
    keywords: ["deep learning", "cnn", "tanaman padi", "deteksi penyakit"]
  },
  {
    id: "2",
    title: "Analisis Sentimen Masyarakat terhadap Kebijakan Pendidikan menggunakan Metode Naive Bayes",
    author: "Siti Nurhaliza",
    authorId: "202152002",
    department: "Sistem Informasi",
    faculty: "Fakultas Ilmu Komputer",
    abstract: "Penelitian ini menganalisis sentimen masyarakat terhadap kebijakan pendidikan terbaru menggunakan metode klasifikasi Naive Bayes dengan tingkat akurasi 89.3%.",
    date: "15 Februari 2026",
    fileSize: "Bab 2",
    fileType: "Jurnal",
    downloads: 189,
    views: 956,
    category: "Jurnal",
    year: "2026",
    keywords: ["sentimen analisis", "naive bayes", "kebijakan pendidikan"]
  },
  {
    id: "3",
    title: "Rancang Bangun Aplikasi E-Learning berbasis Mobile untuk Sekolah Dasar",
    author: "Budi Santoso",
    authorId: "202153003",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract: "Aplikasi e-learning dikembangkan menggunakan framework Flutter dengan fitur interaktif untuk memfasilitasi pembelajaran jarak jauh bagi siswa sekolah dasar.",
    date: "20 Maret 2026",
    fileSize: "Bab 3",
    fileType: "Skripsi",
    downloads: 312,
    views: 1876,
    category: "Skripsi",
    year: "2026",
    keywords: ["e-learning", "mobile", "flutter", "sekolah dasar"]
  },
  {
    id: "4",
    title: "Pengaruh Penggunaan Media Sosial terhadap Prestasi Belajar Mahasiswa",
    author: "Dewi Lestari",
    authorId: "202154004",
    department: "Pendidikan",
    faculty: "Fakultas Keguruan",
    abstract: "Studi kuantitatif ini menginvestigasi dampak penggunaan media sosial terhadap prestasi akademik mahasiswa dengan sampel 300 responden dari 5 universitas.",
    date: "5 April 2026",
    fileSize: "Bab 4",
    fileType: "Tesis",
    downloads: 156,
    views: 745,
    category: "Tesis",
    year: "2026",
    keywords: ["media sosial", "prestasi belajar", "mahasiswa"]
  },
  {
    id: "5",
    title: "Optimasi Jaringan Syaraf Tiruan untuk Prediksi Cuaca di Wilayah Cirebon",
    author: "Rizki Ramadhan",
    authorId: "202155005",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract: "Penelitian ini mengoptimalkan algoritma neural network untuk memprediksi pola cuaca dengan akurasi 92% menggunakan data historis 10 tahun terakhir.",
    date: "18 Mei 2025",
    fileSize: "Bab 5",
    fileType: "Jurnal",
    downloads: 98,
    views: 432,
    category: "Jurnal",
    year: "2025",
    keywords: ["neural network", "prediksi cuaca", "optimasi"]
  },
  {
    id: "6",
    title: "Sistem Pendukung Keputusan Pemilihan Program Studi menggunakan Metode AHP",
    author: "Maya Sari",
    authorId: "202156006",
    department: "Sistem Informasi",
    faculty: "Fakultas Ilmu Komputer",
    abstract: "Sistem pendukung keputusan berbasis web dikembangkan untuk membantu calon mahasiswa memilih program studi sesuai minat dan bakat menggunakan metode AHP.",
    date: "22 Juni 2025",
    fileSize: "Bab 6",
    fileType: "Skripsi",
    downloads: 201,
    views: 1023,
    category: "Skripsi",
    year: "2025",
    keywords: ["spk", "ahp", "pemilihan prodi"]
  },
  {
    id: "7",
    title: "Analisis Perbandingan Algoritma Machine Learning untuk Klasifikasi Berita Hoax",
    author: "Fajar Hidayat",
    authorId: "202157007",
    department: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    abstract: "Penelitian membandingkan algoritma SVM, Random Forest, dan Neural Network untuk mendeteksi berita hoax dengan dataset 5000 berita berbahasa Indonesia.",
    date: "10 Juli 2025",
    fileSize: "Bab 7",
    fileType: "Jurnal",
    downloads: 267,
    views: 1567,
    category: "Jurnal",
    year: "2025",
    keywords: ["machine learning", "hoax detection", "klasifikasi"]
  },
  {
    id: "8",
    title: "Pengembangan Media Pembelajaran Interaktif berbasis Augmented Reality",
    author: "Rina Wati",
    authorId: "202158008",
    department: "Pendidikan",
    faculty: "Fakultas Keguruan",
    abstract: "Media pembelajaran berbasis AR dikembangkan untuk materi sistem tata surya dengan hasil uji kelayakan 88% dari ahli media dan 92% dari siswa.",
    date: "5 Agustus 2024",
    fileSize: "Bab 8",
    fileType: "Tesis",
    downloads: 178,
    views: 890,
    category: "Tesis",
    year: "2024",
    keywords: ["augmented reality", "media pembelajaran", "interaktif"]
  }
];

// Data untuk filter
const categories = [
  { name: "Semua Kategori", count: mockRepositoryData.length, color: "slate" },
  { name: "Skripsi", count: mockRepositoryData.filter(item => item.category === "Skripsi").length, color: "blue" },
  { name: "Tesis", count: mockRepositoryData.filter(item => item.category === "Tesis").length, color: "green" },
  { name: "Jurnal", count: mockRepositoryData.filter(item => item.category === "Jurnal").length, color: "purple" },
  { name: "Disertasi", count: 0, color: "orange" }
];

const years = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];

const faculties = [
  "Semua Fakultas",
  "Fakultas Teknik",
  "Fakultas Ilmu Komputer",
  "Fakultas Keguruan"
];

export default function EResourcePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "author" | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [selectedFaculty, setSelectedFaculty] = useState("Semua Fakultas");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "downloads" | "views">("date");

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedFaculty, yearStart, yearEnd, searchType, sortBy]);

  // Filter items berdasarkan kriteria
  const filteredItems = useMemo(() => {
    return mockRepositoryData.filter(item => {
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
              item.keywords.some(k => k.toLowerCase().includes(query))
            );
        }
      }
      return true;
    }).filter(item => {
      // Filter kategori
      if (selectedCategory !== "Semua Kategori") {
        return item.category === selectedCategory;
      }
      return true;
    }).filter(item => {
      // Filter fakultas
      if (selectedFaculty !== "Semua Fakultas") {
        return item.faculty === selectedFaculty;
      }
      return true;
    }).filter(item => {
      // Filter tahun
      const year = parseInt(item.year);
      const start = yearStart ? parseInt(yearStart) : -Infinity;
      const end = yearEnd ? parseInt(yearEnd) : Infinity;
      return year >= start && year <= end;
    }).sort((a, b) => {
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
  }, [searchQuery, searchType, selectedCategory, selectedFaculty, yearStart, yearEnd, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="bg-[#B21818] pt-16 pb-32 px-4 relative">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Repositori Digital
            </h1>
            <p className="text-white/80 text-sm md:text-base font-medium mb-12">
              Akses karya ilmiah, skripsi, tesis, dan jurnal publikasi civitas akademika UMC
            </p>

            {/* --- SEARCH BAR (Floating) --- */}
            <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 w-full max-w-4xl px-4">
              <div className="bg-white flex items-center rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-1.5 border border-slate-100">
                <div className="flex-1 flex items-center px-4">
                  <Search className="text-slate-400 w-5 h-5 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3.5 text-slate-700 focus:outline-none font-medium text-sm"
                    placeholder="Cari judul, penulis, atau kata kunci..."
                  />
                </div>
                
                {/* Search Type Dropdown */}
                <div className="relative group">
                  <button className="hidden md:flex items-center px-6 border-l border-slate-200 text-slate-500 text-sm gap-2 font-semibold hover:text-red-600 transition-colors">
                    {searchType === "all" && "Semua"}
                    {searchType === "title" && "Judul"}
                    {searchType === "author" && "Penulis"}
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {[
                      { value: "all", label: "Semua" },
                      { value: "title", label: "Judul" },
                      { value: "author", label: "Penulis" }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSearchType(type.value as any)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                          searchType === type.value ? "text-red-600 font-medium" : "text-slate-600"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="bg-[#8E1B1B] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#721414] transition-all ml-2">
                  Cari
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- MAIN CONTENT AREA --- */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-24">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="lg:hidden w-full mb-6 flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl"
          >
            <span className="font-medium text-slate-700">Filter Pencarian</span>
            <Filter className="w-5 h-5 text-slate-400" />
          </button>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* --- SIDEBAR FILTER --- */}
            <aside className={`
              lg:w-80 flex-shrink-0
              ${showMobileFilter ? 'block' : 'hidden lg:block'}
            `}>
              <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[#1E293B] text-xs tracking-wider uppercase flex items-center gap-2">
                    <Filter size={14} />
                    Filter Pencarian
                  </h3>
                  <button 
                    onClick={resetFilters}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    RESET
                  </button>
                </div>

                {/* Kategori Filter */}
                <div className="mb-8">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Kategori</h4>
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const colorClasses = {
                        slate: "bg-slate-50 text-slate-600 border-slate-200",
                        blue: "bg-blue-50 text-blue-600 border-blue-200",
                        green: "bg-green-50 text-green-600 border-green-200",
                        purple: "bg-purple-50 text-purple-600 border-purple-200",
                        orange: "bg-orange-50 text-orange-600 border-orange-200"
                      };
                      
                      return (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`w-full flex justify-between items-center p-3 rounded-xl transition-all ${
                            selectedCategory === cat.name
                              ? `${colorClasses[cat.color as keyof typeof colorClasses]} border`
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="font-medium text-sm">{cat.name}</span>
                          <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                            selectedCategory === cat.name
                              ? colorClasses[cat.color as keyof typeof colorClasses]
                              : 'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fakultas Filter */}
                <div className="mb-8">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Fakultas</h4>
                  <div className="space-y-2">
                    {faculties.map((faculty) => (
                      <button
                        key={faculty}
                        onClick={() => setSelectedFaculty(faculty)}
                        className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                          selectedFaculty === faculty
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {faculty}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tahun Terbit - Dengan warna berbeda */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tahun Terbit</h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-400 mb-1 ml-1">Dari</label>
                      <input 
                        type="text" 
                        value={yearStart}
                        onChange={(e) => setYearStart(e.target.value)}
                        placeholder="2020" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-400 mb-1 ml-1">Sampai</label>
                      <input 
                        type="text" 
                        value={yearEnd}
                        onChange={(e) => setYearEnd(e.target.value)}
                        placeholder="2026" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-300" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* --- RESULTS LIST --- */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    Hasil Pencarian
                  </h2>
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                    {filteredItems.length} ditemukan
                  </span>
                </div>
                
                {/* Sorting */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 text-xs">Urutkan:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:border-red-500"
                  >
                    <option value="date">Terbaru</option>
                    <option value="downloads">Terpopuler</option>
                    <option value="views">Terbanyak dilihat</option>
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedCategory !== "Semua Kategori" || selectedFaculty !== "Semua Fakultas" || yearStart || yearEnd) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      Pencarian: "{searchQuery}"
                      <X size={12} className="cursor-pointer" onClick={() => setSearchQuery("")} />
                    </span>
                  )}
                  {selectedCategory !== "Semua Kategori" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                      {selectedCategory}
                      <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory("Semua Kategori")} />
                    </span>
                  )}
                  {selectedFaculty !== "Semua Fakultas" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                      {selectedFaculty}
                      <X size={12} className="cursor-pointer" onClick={() => setSelectedFaculty("Semua Fakultas")} />
                    </span>
                  )}
                  {(yearStart || yearEnd) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                      Tahun: {yearStart || "..."} - {yearEnd || "..."}
                      <X size={12} className="cursor-pointer" onClick={() => { setYearStart(""); setYearEnd(""); }} />
                    </span>
                  )}
                </div>
              )}

              {/* Results List */}
              <div className="space-y-6">
                {paginatedItems.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Tidak ada hasil</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                      Tidak ditemukan karya ilmiah yang sesuai dengan kriteria pencarian Anda. Coba gunakan kata kunci atau filter yang berbeda.
                    </p>
                  </div>
                ) : (
                  paginatedItems.map((item) => (
                    <article 
                      key={item.id} 
                      className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-6">
                        {/* Icon Container */}
                        <div className="flex-shrink-0 hidden sm:block">
                          <div className="w-14 h-14 bg-white border border-red-100 rounded-xl flex items-center justify-center shadow-sm">
                            <FileText className="text-[#D32F2F] w-7 h-7" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          {/* Category Badge */}
                          <div className="mb-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.category === "Skripsi" ? "bg-blue-50 text-blue-600" :
                              item.category === "Tesis" ? "bg-green-50 text-green-600" :
                              "bg-purple-50 text-purple-600"
                            }`}>
                              {item.category}
                            </span>
                          </div>

                          <h3 className="text-lg md:text-xl font-bold text-[#0F172A] leading-tight mb-2 hover:text-red-600 transition-colors cursor-pointer">
                            {item.title}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs mb-4">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <User size={12} />
                              <span className="font-medium">{item.author}</span>
                              <span className="text-slate-300">({item.authorId})</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <BookOpen size={12} />
                              <span>{item.faculty} - {item.department}</span>
                            </span>
                          </div>

                          <p className="text-slate-400 text-xs md:text-sm italic mb-4 font-medium leading-relaxed border-l-3 border-red-200 pl-4">
                            "{item.abstract}"
                          </p>

                          {/* Keywords */}
                          <div className="flex flex-wrap gap-2 mb-6">
                            {item.keywords.map((keyword, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-medium"
                              >
                                #{keyword}
                              </span>
                            ))}
                          </div>

                          {/* Stats & Download */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-4">
                              <button className="flex items-center gap-2 bg-[#FFF1F1] text-[#D32F2F] px-6 py-2.5 rounded-xl text-[11px] font-bold hover:bg-[#D32F2F] hover:text-white transition-all border border-red-50">
                                <Download size={14} />
                                Download PDF ({item.fileSize})
                              </button>
                              <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Eye size={12} />
                                  {item.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download size={12} />
                                  {item.downloads}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                              <Calendar size={12} className="text-slate-300" />
                              <span>Diunggah:</span>
                              <span className="text-slate-800">{item.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Show limited pages with ellipsis
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
                                ? 'bg-red-500 text-white'
                                : 'border border-slate-200 text-slate-600 hover:border-red-500'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-slate-400">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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