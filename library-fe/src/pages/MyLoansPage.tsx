// src/pages/MyLoansPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import { 
  Search, 
  RefreshCw, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  Info,
  Bell,
  Bookmark,
  ArrowLeft
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/api-config";

// Tipe data untuk peminjaman
interface Loan {
  id: number;
  title: string;
  author: string;
  dueDate: string;
  borrowDate?: string;
  returnDate?: string;
  status: "active" | "warning" | "late" | "returned" | "pending";
  fine: number;
  finePaid?: boolean;
  extensionCount?: number;
  coverImage?: string;
  category?: string;
  notes?: string;
}

// Tipe data untuk user
interface User {
  name: string;
  nim: string;
  faculty: string;
  quotaUsed: number;
  quotaTotal: number;
  totalFines: number;
}

export default function MyLoansPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Mock data user
  const [user] = useState<User>({
    name: "Rizqi Noor Fauzan",
    nim: "230511110",
    faculty: "Teknik Informatika",
    quotaUsed: 4,
    quotaTotal: 5,
    totalFines: 24500
  });

  // Mock data peminjaman
  useEffect(() => {
    // Simulasi loading
    setTimeout(() => {
      setLoans(mockLoans);
      setLoading(false);
    }, 800);
  }, []);

  const mockLoans: Loan[] = [
    {
      id: 1,
      title: "Sistem Informasi Manajemen",
      author: "Kenneth C. Laudon",
      dueDate: "17 Feb 2026",
      borrowDate: "3 Feb 2026",
      status: "warning",
      fine: 0,
      extensionCount: 0,
      category: "Manajemen",
      notes: "Buku ini akan jatuh tempo dalam 3 hari"
    },
    {
      id: 2,
      title: "Pengantar Teknologi Informasi",
      author: "Bagaskoro",
      dueDate: "17 Feb 2026",
      borrowDate: "3 Feb 2026",
      status: "warning",
      fine: 0,
      extensionCount: 0,
      category: "Teknologi"
    },
    {
      id: 3,
      title: "Algoritma & Pemrograman",
      author: "Rinaldi Munir",
      dueDate: "21 Feb 2026",
      borrowDate: "7 Feb 2026",
      status: "active",
      fine: 0,
      extensionCount: 0,
      category: "Pemrograman"
    },
    {
      id: 4,
      title: "Pengantar Bisnis",
      author: "Sadono Sukirno",
      dueDate: "25 Des 2025",
      borrowDate: "1 Des 2025",
      status: "late",
      fine: 24500,
      finePaid: false,
      extensionCount: 1,
      category: "Bisnis",
      notes: "Sudah diperpanjang 1 kali. Denda Rp 1.000 per hari keterlambatan"
    },
    {
      id: 5,
      title: "Basis Data Lanjutan",
      author: "Rahmat Wijaya",
      dueDate: "10 Jan 2026",
      borrowDate: "27 Des 2025",
      returnDate: "5 Jan 2026",
      status: "returned",
      fine: 0,
      category: "Database"
    },
    {
      id: 6,
      title: "Jaringan Komputer",
      author: "Tanenbaum",
      dueDate: "15 Mar 2026",
      borrowDate: "1 Mar 2026",
      status: "pending",
      fine: 0,
      category: "Jaringan",
      notes: "Menunggu konfirmasi petugas"
    }
  ];

  // Filter loans berdasarkan search dan status
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && loan.status === filterStatus;
  });

  // Statistik
  const stats = {
    active: loans.filter(l => l.status === 'active').length,
    warning: loans.filter(l => l.status === 'warning').length,
    late: loans.filter(l => l.status === 'late').length,
    returned: loans.filter(l => l.status === 'returned').length,
    pending: loans.filter(l => l.status === 'pending').length,
    totalFine: loans.reduce((acc, l) => acc + (l.fine || 0), 0)
  };

  // Handle perpanjangan
  const handleExtend = (loanId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Simulasi proses perpanjangan
    setRefreshing(true);
    setTimeout(() => {
      setLoans(prev => prev.map(loan => 
        loan.id === loanId 
          ? { ...loan, dueDate: "24 Feb 2026", extensionCount: (loan.extensionCount || 0) + 1 }
          : loan
      ));
      showNotification("Perpanjangan berhasil! Jatuh tempo menjadi 24 Feb 2026", "success");
      setRefreshing(false);
    }, 1000);
  };

  // Handle bayar denda
  const handlePayFine = (loanId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Simulasi pembayaran
    setTimeout(() => {
      setLoans(prev => prev.map(loan => 
        loan.id === loanId 
          ? { ...loan, finePaid: true, fine: 0 }
          : loan
      ));
      showNotification("Pembayaran denda berhasil!", "success");
    }, 500);
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">Pinjaman Aktif</span>;
      case 'warning':
        return <span className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full">
          <RefreshCw size={10} className="mr-1.5" /> Segera Kembali
        </span>;
      case 'late':
        return <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">Terlambat</span>;
      case 'returned':
        return <span className="inline-flex items-center px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-full">Dikembalikan</span>;
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full">Menunggu</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative">
      <Navbar />

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } flex items-center gap-3 animate-slide-down`}>
          {notification.type === 'success' ? (
            <CheckCircle size={18} className="text-green-600" />
          ) : (
            <AlertCircle size={18} className="text-red-600" />
          )}
          <p className={`text-xs font-medium ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-10 w-full">
        {/* --- TOP SECTION: SEARCH & QUOTA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Search Box */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-red-600 rounded-sm"></div>
                </div>
                <h2 className="font-bold text-slate-800">Cari Buku</h2>
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden text-slate-400 hover:text-red-600 transition-colors"
              >
                <Filter size={18} />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik judul buku untuk dipinjam..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* User Quota Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium tracking-wide">
                {user.faculty} • {user.nim}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">Kuota Pinjaman</span>
                  <span className="text-red-700">{user.quotaUsed}/{user.quotaTotal} BUKU</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-700 rounded-full transition-all duration-500"
                    style={{ width: `${(user.quotaUsed / user.quotaTotal) * 100}%` }}
                  ></div>
                </div>
                {stats.late > 0 && (
                  <p className="text-[10px] text-red-600 font-medium mt-2">
                    ⚠️ Total denda: Rp {stats.totalFine.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Status:</span>
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "all" 
                    ? "bg-red-600 text-white" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua ({loans.length})
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "active" 
                    ? "bg-green-600 text-white" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Aktif ({stats.active})
              </button>
              <button
                onClick={() => setFilterStatus("warning")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "warning" 
                    ? "bg-orange-600 text-white" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Segera Kembali ({stats.warning})
              </button>
              <button
                onClick={() => setFilterStatus("late")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "late" 
                    ? "bg-red-600 text-white" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Terlambat ({stats.late})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "pending" 
                    ? "bg-yellow-600 text-white" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Menunggu ({stats.pending})
              </button>
            </div>
          </div>
        </div>

        {/* --- SECTION TITLE --- */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900">Pinjaman Saya</h2>
          <p className="text-sm text-slate-400">
            Menampilkan {filteredLoans.length} dari {loans.length} pinjaman
          </p>
        </div>

        {/* --- LOANS GRID --- */}
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tidak Ada Pinjaman</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `Tidak ditemukan pinjaman dengan judul "${searchTerm}"`
                : "Anda belum memiliki pinjaman buku saat ini. Kunjungi katalog untuk meminjam buku."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => (
              <div 
                key={loan.id} 
                className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                onClick={() => {
                  setSelectedLoan(loan);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex gap-4 mb-6">
                  {/* Book Cover Placeholder */}
                  <div className="w-24 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-slate-500 opacity-50" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
                      {loan.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mb-3">
                      {loan.author}
                    </p>

                    {/* Status Badge */}
                    {getStatusBadge(loan.status)}
                    
                    {/* Extension Info */}
                    {(loan.extensionCount || 0) > 0 && (
                      <p className="text-[9px] text-blue-600 font-medium mt-2">
                        ✓ Diperpanjang {loan.extensionCount}x
                      </p>
                    )}
                  </div>
                </div>

                {/* Due Date Info */}
                <div className="flex justify-between items-end border-t border-slate-50 pt-4 mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Jatuh Tempo</p>
                    <p className={`font-bold text-sm ${
                      loan.status === 'late' ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      {loan.dueDate}
                    </p>
                    {loan.borrowDate && (
                      <p className="text-[8px] text-slate-400 mt-1">
                        Dipinjam: {loan.borrowDate}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Denda</p>
                    {loan.fine > 0 ? (
                      <div>
                        <p className="font-bold text-red-600 text-sm">Rp {loan.fine.toLocaleString()}</p>
                        {loan.finePaid && (
                          <p className="text-[8px] text-green-600 font-medium">✓ Lunas</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-medium">-</p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {loan.status === 'active' && (
                  <button 
                    onClick={(e) => handleExtend(loan.id, e)}
                    disabled={refreshing}
                    className="w-full bg-[#A31D1D] hover:bg-[#8B1818] text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={14} strokeWidth={3} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'MEMPROSES...' : 'PERPANJANG'}
                  </button>
                )}

                {loan.status === 'warning' && (
                  <button 
                    onClick={(e) => handleExtend(loan.id, e)}
                    disabled={refreshing}
                    className="w-full bg-[#A31D1D] hover:bg-[#8B1818] text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} strokeWidth={3} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'MEMPROSES...' : 'PERPANJANG'}
                  </button>
                )}

                {loan.status === 'late' && !loan.finePaid && (
                  <button 
                    onClick={(e) => handlePayFine(loan.id, e)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    BAYAR DENDA
                  </button>
                )}

                {(loan.status === 'returned' || loan.status === 'pending' || (loan.status === 'late' && loan.finePaid)) && (
                  <button 
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl font-bold text-xs cursor-not-allowed"
                  >
                    {loan.status === 'returned' ? 'SUDAH DIKEMBALIKAN' : 
                     loan.status === 'pending' ? 'MENUNGGU KONFIRMASI' : 'LUNAS'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedLoan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Detail Peminjaman</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <XCircle size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Book Info */}
                  <div className="flex gap-4">
                    <div className="w-20 h-28 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-slate-500 opacity-50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{selectedLoan.title}</h3>
                      <p className="text-sm text-slate-500 mb-2">{selectedLoan.author}</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedLoan.status)}
                        {selectedLoan.category && (
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                            {selectedLoan.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Pinjam</p>
                      <p className="font-bold text-slate-900">{selectedLoan.borrowDate || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jatuh Tempo</p>
                      <p className={`font-bold ${selectedLoan.status === 'late' ? 'text-red-600' : 'text-slate-900'}`}>
                        {selectedLoan.dueDate}
                      </p>
                    </div>
                    {selectedLoan.returnDate && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Kembali</p>
                        <p className="font-bold text-green-600">{selectedLoan.returnDate}</p>
                      </div>
                    )}
                  </div>

                  {/* Fine Info */}
                  {(selectedLoan.fine || 0) > 0 && (
                    <div className="p-4 bg-red-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-red-600 mb-1">Informasi Denda</p>
                          <p className="text-sm text-red-600/80 mb-2">
                            Denda sebesar Rp {selectedLoan.fine?.toLocaleString()}
                          </p>
                          {selectedLoan.finePaid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold">
                              <CheckCircle size={10} />
                              Sudah Dibayar
                            </span>
                          ) : (
                            <button 
                              onClick={() => {
                                handlePayFine(selectedLoan.id, new MouseEvent('click') as any);
                                setShowDetailModal(false);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                            >
                              Bayar Denda
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extension Info */}
                  {(selectedLoan.extensionCount || 0) > 0 && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-800">
                        <span className="font-bold">{selectedLoan.extensionCount}x</span> perpanjangan
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedLoan.notes && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">{selectedLoan.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Tutup
                  </button>
                  {(selectedLoan.status === 'active' || selectedLoan.status === 'warning') && (
                    <button 
                      onClick={(e) => {
                        handleExtend(selectedLoan.id, e as any);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
                    >
                      Perpanjang
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}