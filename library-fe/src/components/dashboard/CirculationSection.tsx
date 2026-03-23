// src/components/dashboard/CirculationSection.tsx
import { useState } from "react";
import { ScanLine, LayoutGrid, Barcode, User, BookOpen, Calendar, CheckCircle, XCircle, AlertTriangle, Loader } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

// ─── Types ─────────────────────────────────────────────────────────────────
interface VerifiedLoan {
  id: string;
  status: string;
  dueDate: string;
  loanDate: string;
  member: {
    nimNidn?: string;
    user: { name: string; email: string };
  };
  item: {
    barcode?: string;
    collection: { title: string; author?: string };
  };
}

interface ReturnResult {
  success: boolean;
  message: string;
}

// ─── Toast Component ────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "warning"; onClose: () => void }) {
  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error:   "bg-red-50 border-red-200 text-red-800",
    warning: "bg-orange-50 border-orange-200 text-orange-800",
  };
  const icons = {
    success: <CheckCircle size={18} className="text-green-600" />,
    error:   <XCircle size={18} className="text-red-600" />,
    warning: <AlertTriangle size={18} className="text-orange-600" />,
  };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${colors[type]} mb-4 animate-slide-up`}>
      {icons[type]}
      <p className="text-sm font-semibold flex-1">{message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-2">×</button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CirculationSection() {
  const [activeTab, setActiveTab] = useState<"borrow" | "return">("borrow");
  const [bookCode, setBookCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Borrow flow state
  const [verifiedLoan, setVerifiedLoan] = useState<VerifiedLoan | null>(null);

  // Return flow state
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ─── Handler: Scan Token (Mode Peminjaman Baru) ─────────────────────────
  const handleVerifyToken = async () => {
    if (!bookCode.trim()) return;
    setLoading(true);
    setVerifiedLoan(null);
    setReturnResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/verify/${bookCode.trim()}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setVerifiedLoan(data.data);
      } else {
        showToast(data.message || "Token tidak valid atau sudah kadaluarsa.", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server. Periksa koneksi Anda.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Handler: Approve Loan (setelah verifikasi token) ───────────────────
  const handleApproveLoan = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.message?.toLowerCase().includes("disetujui") || data.success) {
        showToast("✅ Peminjaman berhasil disetujui! Email notifikasi dikirim ke mahasiswa.", "success");
        setVerifiedLoan(null);
        setBookCode("");
      } else {
        showToast(data.message || "Gagal menyetujui peminjaman.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyetujui peminjaman.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Handler: Reject Loan ────────────────────────────────────────────────
  const handleRejectLoan = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Ditolak oleh pustakawan melalui sirkulasi" }),
      });
      const data = await response.json();

      if (data.success) {
        showToast("Peminjaman telah ditolak.", "warning");
        setVerifiedLoan(null);
        setBookCode("");
      } else {
        showToast(data.message || "Gagal menolak peminjaman.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menolak peminjaman.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Handler: Return Book (Mode Pengembalian) ────────────────────────────
  const handleReturnBook = async () => {
    if (!bookCode.trim()) return;

    // Pada mode pengembalian, input adalah loanId langsung
    const loanId = bookCode.trim();
    setLoading(true);
    setReturnResult(null);
    setVerifiedLoan(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.success) {
        setReturnResult(data);
        const isLate = data.message?.toLowerCase().includes("terlambat");
        showToast(data.message, isLate ? "warning" : "success");
        setBookCode("");
      } else {
        showToast(data.message || "Gagal memproses pengembalian.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat memproses pengembalian.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Handler: tombol Cari (dispatch ke flow yang sesuai) ─────────────────
  const handleSearch = () => {
    if (activeTab === "borrow") {
      handleVerifyToken();
    } else {
      handleReturnBook();
    }
  };

  // ─── Tab switch → reset state ────────────────────────────────────────────
  const handleTabChange = (tab: "borrow" | "return") => {
    setActiveTab(tab);
    setBookCode("");
    setVerifiedLoan(null);
    setReturnResult(null);
    setToast(null);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-8 w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Sirkulasi</h2>
        <p className="text-slate-400 font-medium text-[15px]">
          Masukkan Token / Barcode / Loan ID untuk memproses peminjaman dan pengembalian.
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="w-full max-w-[900px]">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Tabs / Switch */}
      <div className="flex items-center bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 w-full max-w-[500px]">
        <button
          id="tab-borrow"
          onClick={() => handleTabChange("borrow")}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${
            activeTab === "borrow"
              ? "bg-white text-[#9a1b1b] shadow-sm ring-1 ring-slate-900/5"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Peminjaman Baru
        </button>
        <button
          id="tab-return"
          onClick={() => handleTabChange("return")}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${
            activeTab === "return"
              ? "bg-white text-[#9a1b1b] shadow-sm ring-1 ring-slate-900/5"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Pengembalian Buku
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full min-h-[450px]">
        {/* Left Card: Input Mode */}
        <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#B91C1C] rounded-[24px] flex items-center justify-center text-white mb-6 shadow-lg shadow-red-900/20 hover:scale-105 transition-transform duration-300">
            <ScanLine size={48} strokeWidth={1.5} />
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
            Mode {activeTab === "borrow" ? "Peminjaman" : "Pengembalian"}
          </h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mb-10">
            {activeTab === "borrow"
              ? "Masukkan token/QR code yang ditampilkan di aplikasi mahasiswa."
              : "Masukkan Loan ID dari pinjaman yang ingin dikembalikan."}
          </p>

          <div className="w-full relative mt-auto">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
              <Barcode size={24} />
            </div>
            <input
              id="circulation-input"
              type="text"
              value={bookCode}
              onChange={(e) => setBookCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={activeTab === "borrow" ? "Masukkan token/QR code..." : "Masukkan Loan ID..."}
              className="w-full pl-14 pr-28 py-4 bg-white border border-[#B91C1C]/40 focus:border-[#B91C1C] focus:ring-4 focus:ring-[#B91C1C]/10 rounded-[20px] text-slate-800 placeholder:text-slate-400 font-semibold transition-all outline-none"
            />
            <button
              id="btn-circulation-search"
              onClick={handleSearch}
              disabled={loading || !bookCode.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#B91C1C] hover:bg-[#991b1b] disabled:bg-slate-300 text-white px-6 py-2.5 rounded-[14px] font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? <Loader size={14} className="animate-spin" /> : null}
              {loading ? "..." : "Cari"}
            </button>
          </div>
        </div>

        {/* Right Card: Result */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100/50 shadow-sm flex flex-col">
          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-200 border-t-[#B91C1C] mb-4" />
              <p className="font-medium text-sm">Memverifikasi...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !verifiedLoan && !returnResult && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 animate-pulse">
              <LayoutGrid size={64} strokeWidth={1} className="mb-6 opacity-60" />
              <p className="text-slate-400 font-medium tracking-wide">Menunggu data pindaian...</p>
            </div>
          )}

          {/* ── BORROW: Verified Loan Card ── */}
          {!loading && verifiedLoan && activeTab === "borrow" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <p className="text-sm font-bold text-green-700">Token Valid — Data Ditemukan</p>
              </div>

              {/* Book Info */}
              <div className="bg-slate-50 rounded-2xl p-5 space-y-4 mb-6 border border-slate-100">
                <div className="flex items-start gap-3">
                  <BookOpen size={18} className="text-[#B91C1C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Judul Buku</p>
                    <p className="font-extrabold text-slate-900 text-[15px]">{verifiedLoan.item.collection.title}</p>
                    {verifiedLoan.item.collection.author && (
                      <p className="text-xs text-slate-400 mt-0.5">{verifiedLoan.item.collection.author}</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-3">
                  <User size={18} className="text-[#B91C1C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peminjam</p>
                    <p className="font-bold text-slate-900 text-[14px]">{verifiedLoan.member.user.name}</p>
                    {verifiedLoan.member.nimNidn && (
                      <p className="text-xs font-medium text-slate-400">{verifiedLoan.member.nimNidn}</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-[#B91C1C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Batas Kembali</p>
                    <p className="font-bold text-[#B91C1C] text-[14px]">
                      {new Date(verifiedLoan.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-auto">
                <button
                  id="btn-approve-loan"
                  onClick={() => handleApproveLoan(verifiedLoan.id)}
                  disabled={processingId === verifiedLoan.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-green-600/20 flex items-center justify-center gap-2"
                >
                  {processingId === verifiedLoan.id ? <Loader size={14} className="animate-spin" /> : null}
                  {processingId === verifiedLoan.id ? "Memproses..." : "✓ Setujui Peminjaman"}
                </button>
                <button
                  id="btn-reject-loan"
                  onClick={() => handleRejectLoan(verifiedLoan.id)}
                  disabled={processingId === verifiedLoan.id}
                  className="px-4 py-3 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 text-slate-500 rounded-xl font-bold text-sm transition-colors"
                >
                  Tolak
                </button>
              </div>
            </div>
          )}

          {/* ── RETURN: Result Card ── */}
          {!loading && returnResult && activeTab === "return" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {returnResult.message?.toLowerCase().includes("terlambat") ? (
                <>
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-orange-500" />
                  </div>
                  <h4 className="text-[18px] font-extrabold text-slate-900 mb-2">Pengembalian Terlambat</h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xs">{returnResult.message}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h4 className="text-[18px] font-extrabold text-slate-900 mb-2">Buku Dikembalikan!</h4>
                  <p className="text-sm text-slate-600 font-medium">{returnResult.message}</p>
                </>
              )}
              <button
                onClick={() => { setReturnResult(null); setToast(null); }}
                className="mt-6 px-6 py-2.5 bg-[#B91C1C] hover:bg-[#991b1b] text-white rounded-xl font-bold text-sm transition-colors"
              >
                Proses Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
