// src/pages/MyLoansPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  RefreshCw,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  CalendarDays,
  RotateCcw,
} from "lucide-react";
import loanService, { type Loan } from "@/services/loanService";
import { authClient } from "@/utils/auth-client";
import { useToast } from "@/hooks/useToast";
import { formatDateID, calcLateDays } from "@/utils/format";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Hitung status visual dari data loan nyata */
function getLoanStatus(loan: Loan): "active" | "warning" | "late" | "returned" | "pending" | "rejected" {
  if (loan.status === "pending") return "pending";
  if (loan.status === "rejected") return "rejected";
  if (loan.status === "returned") return "returned";
  if (loan.status === "approved" || loan.status === "extended") {
    const lateDays = calcLateDays(loan.dueDate);
    if (lateDays > 0) return "late";
    // Segera jatuh tempo: ≤ 3 hari
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 ? "warning" : "active";
  }
  return "active";
}

const STATUS_CONFIG = {
  active: { label: "Pinjaman Aktif", bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  warning: { label: "Segera Kembali", bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  late: { label: "Terlambat", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  returned: { label: "Dikembalikan", bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  pending: { label: "Menunggu Konfirmasi", bg: "bg-yellow-50", text: "text-yellow-600", dot: "bg-yellow-500" },
  rejected: { label: "Ditolak", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
} as const;

type VisualStatus = keyof typeof STATUS_CONFIG;

const FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "warning", label: "Segera Kembali" },
  { value: "late", label: "Terlambat" },
  { value: "pending", label: "Menunggu" },
  { value: "returned", label: "Dikembalikan" },
];

// ─── Sub-component: Status Badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: VisualStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Sub-component: Loan Card ─────────────────────────────────────────────────

interface LoanCardProps {
  loan: Loan;
  status: VisualStatus;
  isExtending: boolean;
  onExtend: (loanId: string) => void;
  onViewDetail: (loan: Loan) => void;
}

function LoanCard({ loan, status, isExtending, onExtend, onViewDetail }: LoanCardProps) {
  const title = loan.item?.collection?.title ?? loan.collectionTitle ?? "Judul tidak tersedia";
  const author = loan.item?.collection?.author ?? loan.collectionAuthor ?? "Penulis tidak tersedia";
  const image = loan.item?.collection?.image;
  const lateDays = calcLateDays(loan.dueDate);

  return (
    <div
      className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
      onClick={() => onViewDetail(loan)}
    >
      <div className="flex gap-4 mb-5">
        {/* Cover */}
        <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-7 h-7 text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 leading-snug mb-1 line-clamp-2 text-sm">
            {title}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mb-3 truncate">{author}</p>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Dates */}
      <div className="flex justify-between items-end border-t border-slate-50 pt-4 mb-5 text-[10px]">
        <div>
          <p className="font-bold text-slate-300 uppercase tracking-widest mb-1">Jatuh Tempo</p>
          <p className={`font-bold text-sm ${status === "late" ? "text-red-600" : "text-slate-900"}`}>
            {formatDateID(loan.dueDate)}
          </p>
          {loan.loanDate && (
            <p className="text-slate-400 mt-0.5">Dipinjam: {formatDateID(loan.loanDate)}</p>
          )}
        </div>
        {(loan.fine ?? 0) > 0 && (
          <div className="text-right">
            <p className="font-bold text-slate-300 uppercase tracking-widest mb-1">Denda</p>
            <p className="font-bold text-red-600 text-sm">
              Rp {(loan.fine ?? 0).toLocaleString("id-ID")}
            </p>
            {lateDays > 0 && (
              <p className="text-red-400 mt-0.5">{lateDays} hari terlambat</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto">
        {(status === "active" || status === "warning") && (
          <button
            onClick={(e) => { e.stopPropagation(); onExtend(loan.id); }}
            disabled={isExtending}
            className="w-full bg-[#A31D1D] hover:bg-[#8B1818] disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw size={13} strokeWidth={3} className={isExtending ? "animate-spin" : ""} />
            {isExtending ? "MEMPROSES..." : "PERPANJANG"}
          </button>
        )}

        {status === "pending" && (
          <div className="w-full bg-yellow-50 text-yellow-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <Clock size={13} />
            MENUNGGU KONFIRMASI
          </div>
        )}

        {status === "returned" && (
          <div className="w-full bg-gray-50 text-gray-500 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <CheckCircle size={13} />
            SUDAH DIKEMBALIKAN
          </div>
        )}

        {status === "rejected" && (
          <div className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <XCircle size={13} />
            DITOLAK
          </div>
        )}

        {status === "late" && (
          <div className="w-full bg-red-50 text-red-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <AlertCircle size={13} />
            TERLAMBAT — KEMBALIKAN KE PERPUSTAKAAN
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  loan: Loan;
  status: VisualStatus;
  isExtending: boolean;
  onExtend: (id: string) => void;
  onClose: () => void;
}

function DetailModal({ loan, status, isExtending, onExtend, onClose }: DetailModalProps) {
  const title = loan.item?.collection?.title ?? loan.collectionTitle ?? "Judul tidak tersedia";
  const author = loan.item?.collection?.author ?? loan.collectionAuthor ?? "Penulis tidak tersedia";
  const lateDays = calcLateDays(loan.dueDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Detail Peminjaman</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex gap-4">
              <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                {loan.item?.collection?.image ? (
                  <img src={loan.item.collection.image} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 mb-2">{author}</p>
                <StatusBadge status={status} />
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Pinjam</p>
                <p className="font-bold text-slate-900 text-sm">{formatDateID(loan.loanDate)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jatuh Tempo</p>
                <p className={`font-bold text-sm ${status === "late" ? "text-red-600" : "text-slate-900"}`}>
                  {formatDateID(loan.dueDate)}
                </p>
              </div>
              {loan.returnDate && (
                <div className="p-3 bg-green-50 rounded-xl col-span-2">
                  <p className="text-[10px] font-bold text-green-400 uppercase mb-1">Tanggal Dikembalikan</p>
                  <p className="font-bold text-green-700 text-sm">{formatDateID(loan.returnDate)}</p>
                </div>
              )}
            </div>

            {/* Fine */}
            {(loan.fine ?? 0) > 0 && (
              <div className="p-4 bg-red-50 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700 text-sm">Denda Keterlambatan</p>
                  <p className="text-red-600 text-sm mt-0.5">
                    Rp {(loan.fine ?? 0).toLocaleString("id-ID")}
                    {lateDays > 0 && ` (${lateDays} hari × Rp 2.000)`}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {loan.notes && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
                <p className="text-xs text-slate-600">{loan.notes}</p>
              </div>
            )}

            {/* Reject Reason */}
            {loan.rejectReason && (
              <div className="p-3 bg-red-50 rounded-xl">
                <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Alasan Penolakan</p>
                <p className="text-xs text-red-600">{loan.rejectReason}</p>
              </div>
            )}

            {/* QR Code */}
            {status === "pending" && loan.qrCodeUrl && (
              <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-center">Tunjukkan QR Code ini ke Petugas Perpustakaan</p>
                <div className="bg-slate-50 p-2 rounded-xl">
                   <img src={loan.qrCodeUrl} alt="QR Code Peminjaman" className="w-48 h-48 object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Tutup
            </button>
            {(status === "active" || status === "warning") && (
              <button
                onClick={() => { onExtend(loan.id); onClose(); }}
                disabled={isExtending}
                className="flex-1 px-4 py-3 bg-[#A31D1D] hover:bg-[#8B1818] disabled:bg-slate-200 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} />
                Perpanjang
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MyLoansPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const toast = useToast();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // ─── Auth guard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      navigate("/login");
    }
  }, [sessionLoading, session, navigate]);

  // ─── Fetch loans ─────────────────────────────────────────────────────────────

  const fetchLoans = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await loanService.getMyLoanHistory();
      setLoans(data);
    } catch (err) {
      toast.error(
        "Gagal Memuat Data",
        err instanceof Error ? err.message : "Terjadi kesalahan saat memuat pinjaman"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchLoans();
    }
  }, [sessionLoading, session, fetchLoans]);

  // ─── Perpanjang ──────────────────────────────────────────────────────────────

  const handleExtend = useCallback(async (loanId: string) => {
    setExtendingId(loanId);
    const loadingId = toast.loading("Memproses...", "Sedang mengajukan perpanjangan");
    try {
      // Hitung dueDate baru: +7 hari dari sekarang
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 7);
      const newDueDateStr = newDueDate.toISOString().split("T")[0];

      // Backend endpoint perpanjang (notes sebagai info)
      await loanService.approveLoan(loanId, `Perpanjangan. Jatuh tempo baru: ${newDueDateStr}`);
      toast.removeToast(loadingId);
      toast.success("Perpanjangan Berhasil", `Jatuh tempo baru: ${formatDateID(newDueDateStr)}`);
      await fetchLoans(true);
    } catch (err) {
      toast.removeToast(loadingId);
      toast.error(
        "Perpanjangan Gagal",
        err instanceof Error ? err.message : "Terjadi kesalahan"
      );
    } finally {
      setExtendingId(null);
    }
  }, [fetchLoans]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Computed data ────────────────────────────────────────────────────────────

  const loansWithStatus = loans.map((loan) => ({
    loan,
    status: getLoanStatus(loan) as VisualStatus,
  }));

  const filteredLoans = loansWithStatus.filter(({ loan, status }) => {
    const title = (loan.item?.collection?.title ?? loan.collectionTitle ?? "").toLowerCase();
    const author = (loan.item?.collection?.author ?? loan.collectionAuthor ?? "").toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = title.includes(q) || author.includes(q);
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && status === filterStatus;
  });

  const stats = {
    active: loansWithStatus.filter((l) => l.status === "active").length,
    warning: loansWithStatus.filter((l) => l.status === "warning").length,
    late: loansWithStatus.filter((l) => l.status === "late").length,
    pending: loansWithStatus.filter((l) => l.status === "pending").length,
    returned: loansWithStatus.filter((l) => l.status === "returned").length,
    totalFine: loans.reduce((acc, l) => acc + (l.fine ?? 0), 0),
  };

  const user = session?.user;

  // ─── Loading state ────────────────────────────────────────────────────────────

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Skeleton className="lg:col-span-2 h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <Skeleton className="h-14 rounded-xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-[24px]" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-10 w-full">

        {/* ── TOP SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Search */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800">Cari Pinjaman</h2>
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
                placeholder="Ketik judul atau penulis..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* User Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-linear-to-br from-red-500 to-red-700 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{user?.name}</h3>
              <p className="text-xs text-slate-400 mb-3 truncate">{user?.email}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">Pinjaman Aktif</span>
                  <span className="text-red-700">{stats.active + stats.warning + stats.late} buku</span>
                </div>
                {stats.totalFine > 0 && (
                  <p className="text-[10px] text-red-600 font-medium pt-1">
                    ⚠ Denda: Rp {stats.totalFine.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className={`mb-6 transition-all duration-300 ${showFilters ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
              {FILTER_OPTIONS.map((opt) => {
                const count =
                  opt.value === "all"
                    ? loans.length
                    : loansWithStatus.filter((l) => l.status === opt.value).length;
                const isActive = filterStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-red-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-slate-900">Pinjaman Saya</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-400 hidden sm:block">
              {filteredLoans.length} dari {loans.length} pinjaman
            </p>
            <button
              onClick={() => fetchLoans(true)}
              disabled={refreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={15} className={`text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <CalendarDays className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tidak Ada Pinjaman</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              {searchTerm
                ? `Tidak ditemukan pinjaman dengan kata kunci "${searchTerm}"`
                : filterStatus !== "all"
                  ? `Tidak ada pinjaman dengan status "${FILTER_OPTIONS.find((o) => o.value === filterStatus)?.label}"`
                  : "Anda belum memiliki pinjaman buku. Kunjungi katalog untuk meminjam."}
            </p>
            {(searchTerm || filterStatus !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setFilterStatus("all"); }}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLoans.map(({ loan, status }) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                status={status}
                isExtending={extendingId === loan.id}
                onExtend={handleExtend}
                onViewDetail={setSelectedLoan}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Detail Modal ── */}
      {selectedLoan && (
        <DetailModal
          loan={selectedLoan}
          status={getLoanStatus(selectedLoan) as VisualStatus}
          isExtending={extendingId === selectedLoan.id}
          onExtend={handleExtend}
          onClose={() => setSelectedLoan(null)}
        />
      )}

      <Footer />
    </div>
  );
}