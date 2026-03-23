// src/components/dashboard/LoansSection.tsx
import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  Search,
  User,
  Calendar,
  ChevronDown,
  RefreshCw,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";
import { Skeleton } from "@/components/ui/skeleton";

interface Loan {
  id: string;
  itemId: string;
  memberId: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  purpose?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "returned" | "extended";
  requestDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectReason?: string;
  item?: {
    collection?: {
      title?: string;
    };
  };
  member?: {
    nimNidn?: string;
    user?: {
      name?: string;
    };
  };
}

interface LoansSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function LoansSection({ searchTerm, onSearchChange }: LoansSectionProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "returned">("pending");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returnModalLoan, setReturnModalLoan] = useState<Loan | null>(null);
  const [returnResult, setReturnResult] = useState<{ message: string; isLate: boolean } | null>(null);

  useEffect(() => {
    fetchLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`${API_BASE_URL}/api/loans${statusParam}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        // Pastikan data.data adalah array
        if (Array.isArray(data.data)) {
          setLoans(data.data);
        } else {
          console.error("Data is not an array:", data.data);
          setLoans([]);
          setError("Format data tidak sesuai");
        }
      } else {
        setLoans([]);
        setError(data.message || "Gagal memuat data");
      }
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      setError("Gagal terhubung ke server");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: actionNotes }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Peminjaman disetujui!");
        setSelectedLoan(null);
        setActionNotes("");
        fetchLoans();
      } else {
        alert(data.message || "Gagal menyetujui peminjaman");
      }
    } catch (error) {
      console.error("Error approving loan:", error);
      alert("Gagal menyetujui peminjaman");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (loanId: string) => {
    const reason = prompt("Alasan penolakan:");
    if (!reason) return;

    setProcessingId(loanId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Peminjaman ditolak!");
        fetchLoans();
      } else {
        alert(data.message || "Gagal menolak peminjaman");
      }
    } catch (error) {
      console.error("Error rejecting loan:", error);
      alert("Gagal menolak peminjaman");
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Handler: Return Book ───────────────────────────────────────────
  const handleReturn = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        const isLate = data.message?.toLowerCase().includes("terlambat");
        setReturnResult({ message: data.message, isLate });
        fetchLoans();
      } else {
        alert(data.message || "Gagal memproses pengembalian");
        setReturnModalLoan(null);
      }
    } catch {
      alert("Gagal terhubung ke server");
      setReturnModalLoan(null);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    // Check if overdue
    if (status === 'approved' && dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      
      if (today > due) {
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide bg-red-100 text-red-700`}>
            <Clock size={14} /> Terlambat
          </span>
        );
      }
    }

    const statusConfig: Record<string, { color: string; icon: React.ElementType; text: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock, text: "Menunggu" },
      approved: { color: "bg-blue-100 text-blue-700", icon: BookOpen, text: "Dipinjam" },
      rejected: { color: "bg-red-100 text-red-700", icon: XCircle, text: "Ditolak" },
      returned: { color: "bg-gray-100 text-gray-700", icon: CheckCircle, text: "Dikembalikan" },
      extended: { color: "bg-purple-100 text-purple-700", icon: Clock, text: "Diperpanjang" },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide ${config.color}`}>
        <Icon size={14} /> {config.text}
      </span>
    );
  };

  // Filter dengan pengecekan keamanan
  const filteredLoans = Array.isArray(loans) 
    ? loans.filter(loan => {
        if (!loan) return false;
        
        const bookTitle = loan.item?.collection?.title?.toLowerCase() || '';
        const borrowerName = loan.member?.user?.name?.toLowerCase() || '';
        const borrowerNim = loan.member?.nimNidn?.toString() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return bookTitle.includes(searchLower) ||
               borrowerName.includes(searchLower) ||
               borrowerNim.includes(searchTerm);
      })
    : [];

  // Hitung statistik dengan pengecekan keamanan
  const stats = {
    pending: Array.isArray(loans) ? loans.filter(l => l?.status === 'pending').length : 0,
    approved: Array.isArray(loans) ? loans.filter(l => l?.status === 'approved' && new Date(l.dueDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)).length : 0,
    overdue: Array.isArray(loans) ? loans.filter(l => l?.status === 'approved' && new Date(l.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)).length : 0,
    returned: Array.isArray(loans) ? loans.filter(l => l?.status === 'returned').length : 0,
  };

  return (
    <div className="w-full">
      {/* Main Container */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Header Controls */}
        <div className="p-6 md:px-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-[20px] font-extrabold text-[#0F172A] tracking-tight">Peminjaman & Persetujuan</h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Status */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "pending" | "approved" | "returned")}
                className="appearance-none bg-[#F8FAFC] border-none rounded-xl pl-4 pr-10 py-2.5 text-[13px] font-bold text-slate-600 focus:ring-2 focus:ring-red-500/10 cursor-pointer min-w-[200px]"
              >
                <option value="pending">Menunggu Persetujuan</option>
                <option value="approved">Sedang Dipinjam</option>
                <option value="returned">Dikembalikan</option>
                <option value="all">Semua</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={3} />
            </div>
            
            {/* Search */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari peminjaman..."
                className="w-full md:w-64 pl-11 pr-4 py-2.5 bg-[#F8FAFC] border-none rounded-xl text-[13px] font-medium text-slate-600 focus:ring-2 focus:ring-red-500/10 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchLoans}
              className="w-10 h-10 bg-[#F8FAFC] rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all flex items-center justify-center shrink-0"
              title="Refresh data"
            >
              <RefreshCw size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="p-6 md:px-8 border-b border-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card: Menunggu Persetujuan */}
            <div className="bg-[#FEFCE8] rounded-2xl p-5 flex flex-col justify-between h-[100px]">
              <div className="flex items-start justify-between w-full">
                <Clock className="text-[#A16207]" size={20} strokeWidth={2.5} />
                <span className="text-[28px] font-black leading-none text-[#A16207]">
                  {stats.pending}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#A16207]">Menunggu Persetujuan</p>
            </div>

            {/* Card: Sedang Dipinjam (Approved & Not Overdue) */}
            <div className="bg-[#EFF6FF] rounded-2xl p-5 flex flex-col justify-between h-[100px]">
              <div className="flex items-start justify-between w-full">
                <BookOpen className="text-[#1D4ED8]" size={20} strokeWidth={2.5} />
                <span className="text-[28px] font-black leading-none text-[#1D4ED8]">
                  {stats.approved}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#1D4ED8]">Sedang Dipinjam</p>
            </div>

            {/* Card: Dikembalikan */}
            <div className="bg-[#F3F4F6] rounded-2xl p-5 flex flex-col justify-between h-[100px]">
              <div className="flex items-start justify-between w-full">
                <CheckCircle className="text-[#4B5563]" size={20} strokeWidth={2.5} />
                <span className="text-[28px] font-black leading-none text-[#4B5563]">
                  {stats.returned}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#4B5563]">Dikembalikan</p>
            </div>

            {/* Card: Terlambat */}
            <div className="bg-[#FEF2F2] rounded-2xl p-5 flex flex-col justify-between h-[100px]">
              <div className="flex items-start justify-between w-full">
                <XCircle className="text-[#B91C1C]" size={20} strokeWidth={2.5} />
                <span className="text-[28px] font-black leading-none text-[#B91C1C]">
                  {stats.overdue}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#B91C1C]">Terlambat</p>
            </div>

          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6 md:px-8">
          {loading ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[140px] w-full rounded-[20px]" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-slate-400">
                {searchTerm 
                  ? "Tidak ada hasil pencarian" 
                  : "Tidak ada data peminjaman"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div 
                  key={loan.id} 
                  className="bg-[#F8FAFC] rounded-[20px] p-6 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-red-100 group-hover:bg-red-50 transition-colors">
                        <BookOpen className="text-slate-400 group-hover:text-[#B91C1C] transition-colors" size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#0F172A] text-[15px] leading-snug hover:text-[#B91C1C] transition-colors">{loan.item?.collection?.title || 'Judul tidak tersedia'}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <User size={13} className="text-slate-400" />
                          <span className="text-[13px] font-bold text-slate-600">{loan.member?.user?.name || 'Nama tidak tersedia'}</span>
                          {loan.member?.nimNidn && (
                            <span className="text-[11px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">{loan.member.nimNidn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(loan.status, loan.dueDate)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mulai Pinjam</p>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Batas Kembali</p>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-bold text-[#B91C1C]">
                          {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}
                        </span>
                      </div>
                    </div>
                    {loan.purpose && (
                      <div className="md:col-span-2 lg:col-span-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tujuan / Catatan</p>
                        <span className="text-[13px] font-medium text-slate-600 truncate block">{loan.purpose}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Pending: Setujui / Tolak */}
                  {loan.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-5 mt-5 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setActionNotes('');
                        }}
                        disabled={processingId === loan.id}
                        className="flex-1 bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                      >
                         {processingId === loan.id ? 'Memproses...' : '✓ Setujui Peminjaman'}
                      </button>
                      <button
                        onClick={() => handleReject(loan.id)}
                        disabled={processingId === loan.id}
                        className="flex-none bg-white text-slate-400 border border-slate-200 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                      >
                         Tolak
                      </button>
                    </div>
                  )}

                  {/* Action Buttons - Approved: Proses Pengembalian */}
                  {loan.status === 'approved' && (
                    <div className="pt-5 mt-5 border-t border-slate-200">
                      <button
                        id={`btn-return-${loan.id}`}
                        onClick={() => {
                          setReturnModalLoan(loan);
                          setReturnResult(null);
                        }}
                        disabled={processingId === loan.id}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        {processingId === loan.id ? 'Memproses...' : 'Proses Pengembalian'}
                      </button>
                    </div>
                  )}

                  {/* Info untuk status lainnya */}
                  {loan.status === 'rejected' && loan.rejectReason && (
                    <div className="mt-4 p-3 bg-red-50/50 rounded-xl text-[13px] border border-red-100">
                      <span className="font-bold text-red-700">Alasan Penolakan: </span>
                      <span className="text-red-600 font-medium">{loan.rejectReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Approve Loan ── */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <h3 className="text-[18px] font-extrabold text-slate-900 mb-5">Setujui Peminjaman</h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                <p className="text-[13px] text-slate-600 flex justify-between">
                  <span className="font-bold text-slate-400">Buku</span>
                  <span className="font-bold text-slate-900 text-right">{selectedLoan.item?.collection?.title}</span>
                </p>
                <div className="h-px bg-slate-200"></div>
                <p className="text-[13px] text-slate-600 flex justify-between">
                  <span className="font-bold text-slate-400">Peminjam</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedLoan.member?.user?.name} <span className="text-slate-400">({selectedLoan.member?.nimNidn})</span>
                  </span>
                </p>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 mb-2 block">Catatan Tambahan (Opsional)</label>
                <textarea
                  placeholder="Opsional, berikan pesan ke mahasiswa..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedLoan(null); setActionNotes(''); }}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleApprove(selectedLoan.id)}
                disabled={processingId === selectedLoan.id}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl text-[13px] font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
              >
                {processingId === selectedLoan.id ? 'Memproses...' : 'Setujui Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Return Book ── */}
      {returnModalLoan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl animate-slide-up">
            {returnResult ? (
              <>
                {/* ── Result State ── */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  returnResult.isLate ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  {returnResult.isLate
                    ? <AlertTriangle size={28} className="text-orange-500" />
                    : <CheckCircle size={28} className="text-green-500" />
                  }
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-900 mb-3 text-center">
                  {returnResult.isLate ? 'Pengembalian Terlambat' : 'Buku Berhasil Dikembalikan!'}
                </h3>
                <p className="text-sm text-slate-600 font-medium text-center leading-relaxed mb-6">
                  {returnResult.message}
                </p>
                <button
                  onClick={() => { setReturnModalLoan(null); setReturnResult(null); }}
                  className="w-full bg-[#B91C1C] hover:bg-[#991b1b] text-white px-4 py-3 rounded-xl text-[13px] font-bold transition-all"
                >
                  Tutup
                </button>
              </>
            ) : (
              <>
                {/* ── Confirm State ── */}
                <h3 className="text-[18px] font-extrabold text-slate-900 mb-5">Konfirmasi Pengembalian Buku</h3>

                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100 mb-6">
                  <p className="text-[13px] text-slate-600 flex justify-between">
                    <span className="font-bold text-slate-400">Buku</span>
                    <span className="font-bold text-slate-900 text-right max-w-[60%] truncate">{returnModalLoan.item?.collection?.title}</span>
                  </p>
                  <div className="h-px bg-slate-200"></div>
                  <p className="text-[13px] text-slate-600 flex justify-between">
                    <span className="font-bold text-slate-400">Peminjam</span>
                    <span className="font-bold text-slate-900">{returnModalLoan.member?.user?.name}</span>
                  </p>
                  <div className="h-px bg-slate-200"></div>
                  <p className="text-[13px] text-slate-600 flex justify-between">
                    <span className="font-bold text-slate-400">Batas Kembali</span>
                    <span className={`font-bold ${
                      new Date(returnModalLoan.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
                        ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      {new Date(returnModalLoan.dueDate).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}
                    </span>
                  </p>
                </div>

                <p className="text-[12px] text-slate-500 font-medium mb-5 text-center">
                  Denda keterlambatan: <strong className="text-[#B91C1C]">Rp 500 / hari</strong> jika melewati batas kembali.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReturnModalLoan(null)}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-confirm-return"
                    onClick={() => handleReturn(returnModalLoan.id)}
                    disabled={processingId === returnModalLoan.id}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} />
                    {processingId === returnModalLoan.id ? 'Memproses...' : 'Kembalikan Buku'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}