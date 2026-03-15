// src/components/dashboard/LoansSection.tsx
import { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  User,
  Calendar,
  Search,
  ChevronDown
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface Loan {
  id: string;
  bookTitle: string;
  bookId: string;
  borrowerName: string;
  borrowerNim: string;
  borrowerId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "active" | "returned" | "overdue";
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectReason?: string;
}

interface LoansSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function LoansSection({ searchTerm, onSearchChange }: LoansSectionProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "active" | "returned">("pending");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoans();
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
      
      // Debug: lihat struktur data dari API
      console.log("Loans API Response:", data);
      
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; text: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock, text: "Menunggu" },
      approved: { color: "bg-green-100 text-green-700", icon: CheckCircle, text: "Disetujui" },
      rejected: { color: "bg-red-100 text-red-700", icon: XCircle, text: "Ditolak" },
      active: { color: "bg-blue-100 text-blue-700", icon: BookOpen, text: "Dipinjam" },
      returned: { color: "bg-gray-100 text-gray-700", icon: CheckCircle, text: "Dikembalikan" },
      overdue: { color: "bg-red-100 text-red-700", icon: Clock, text: "Terlambat" },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
        <Icon size={12} /> {config.text}
      </span>
    );
  };

  // Filter dengan pengecekan keamanan
  const filteredLoans = Array.isArray(loans) 
    ? loans.filter(loan => {
        if (!loan) return false;
        
        const bookTitle = loan.bookTitle?.toLowerCase() || '';
        const borrowerName = loan.borrowerName?.toLowerCase() || '';
        const borrowerNim = loan.borrowerNim?.toString() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return bookTitle.includes(searchLower) ||
               borrowerName.includes(searchLower) ||
               borrowerNim.includes(searchTerm);
      })
    : [];

  // Hitung statistik dengan pengecekan keamanan
  const stats = {
    pending: Array.isArray(loans) ? loans.filter(l => l?.status === 'pending').length : 0,
    approved: Array.isArray(loans) ? loans.filter(l => l?.status === 'approved').length : 0,
    active: Array.isArray(loans) ? loans.filter(l => l?.status === 'active').length : 0,
    overdue: Array.isArray(loans) ? loans.filter(l => l?.status === 'overdue').length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-slate-50">
          <h3 className="text-xl font-bold text-slate-900">Peminjaman & Persetujuan</h3>
          <div className="flex items-center gap-4">
            {/* Filter Status */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-slate-100 border-none rounded-xl px-5 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-red-500/10 cursor-pointer"
              >
                <option value="pending">Menunggu Persetujuan</option>
                <option value="approved">Disetujui</option>
                <option value="active">Sedang Dipinjam</option>
                <option value="returned">Dikembalikan</option>
                <option value="all">Semua</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari peminjaman..."
                className="pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-red-500/10"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchLoans}
              className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
              title="Refresh data"
            >
              <svg 
                className="w-4 h-4 text-slate-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-100">
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-600" size={20} />
              <span className="text-2xl font-bold text-yellow-700">
                {stats.pending}
              </span>
            </div>
            <p className="text-xs font-medium text-yellow-700">Menunggu Persetujuan</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-2xl font-bold text-green-700">
                {stats.approved}
              </span>
            </div>
            <p className="text-xs font-medium text-green-700">Disetujui</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="text-blue-600" size={20} />
              <span className="text-2xl font-bold text-blue-700">
                {stats.active}
              </span>
            </div>
            <p className="text-xs font-medium text-blue-700">Sedang Dipinjam</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="text-red-600" size={20} />
              <span className="text-2xl font-bold text-red-700">
                {stats.overdue}
              </span>
            </div>
            <p className="text-xs font-medium text-red-700">Terlambat</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loan Cards */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B91C1C]"></div>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">
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
                  className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 hover:bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                        <BookOpen className="text-[#B91C1C]" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{loan.bookTitle || 'Judul tidak tersedia'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <User size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{loan.borrowerName || 'Nama tidak tersedia'}</span>
                          {loan.borrowerNim && (
                            <span className="text-xs text-slate-400">({loan.borrowerNim})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(loan.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-slate-600">
                        Pinjam: {loan.startDate ? new Date(loan.startDate).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-slate-600">
                        Kembali: {loan.endDate ? new Date(loan.endDate).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                    {loan.purpose && (
                      <div className="flex items-center gap-2 text-sm md:col-span-3">
                        <span className="text-slate-400">Tujuan:</span>
                        <span className="text-slate-600">{loan.purpose}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Hanya tampil untuk status pending */}
                  {loan.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setActionNotes('');
                        }}
                        disabled={processingId === loan.id}
                        className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {processingId === loan.id ? 'Memproses...' : 'Setujui'}
                      </button>
                      <button
                        onClick={() => handleReject(loan.id)}
                        disabled={processingId === loan.id}
                        className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Tolak
                      </button>
                    </div>
                  )}

                  {/* Info untuk status lainnya */}
                  {loan.status === 'rejected' && loan.rejectReason && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm">
                      <span className="font-medium text-red-700">Alasan ditolak: </span>
                      <span className="text-red-600">{loan.rejectReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Approval */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Setujui Peminjaman</h3>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Buku:</span> {selectedLoan.bookTitle}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Peminjam:</span> {selectedLoan.borrowerName} ({selectedLoan.borrowerNim})
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Tanggal:</span> {new Date(selectedLoan.startDate).toLocaleDateString('id-ID')} - {new Date(selectedLoan.endDate).toLocaleDateString('id-ID')}
                </p>
              </div>
              <textarea
                placeholder="Catatan (opsional)"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500/20 transition-all"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedLoan(null);
                  setActionNotes('');
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleApprove(selectedLoan.id)}
                disabled={processingId === selectedLoan.id}
                className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processingId === selectedLoan.id ? 'Memproses...' : 'Setujui'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}