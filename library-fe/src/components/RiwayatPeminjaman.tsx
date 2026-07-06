import { useEffect, useState } from "react";
import { AlertCircle, Info, Clock, RefreshCw, RotateCcw } from "lucide-react";
import loanService, { type Loan as LoanData } from "@/services/loanService";
import { useToast } from "@/hooks/useToast";

interface RiwayatPeminjamanProps {
  type: "active" | "history";
  view?: "grid" | "table";
}

const RiwayatPeminjaman = ({ type, view = "grid" }: RiwayatPeminjamanProps) => {
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loanService.getMyLoanHistory();

        if (type === "active") {
          setLoans(
            data.filter((l) =>
              ["pending", "approved", "extended"].includes(l.status)
            )
          );
        } else {
          setLoans(
            data.filter((l) => ["returned", "rejected"].includes(l.status))
          );
        }
      } catch (err) {
        console.error("Fetch loans error:", err);
        setError(
          err instanceof Error ? err.message : "Gagal memuat riwayat peminjaman"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [type]);

  if (loading) {
    return (
      <div className="py-12 text-center animate-pulse">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground font-medium italic">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center bg-accent rounded-2xl border border-primary p-6">
        <AlertCircle className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="text-primary font-bold mb-1">Terjadi Kesalahan</h3>
        <p className="text-primary/80 text-xs">{error}</p>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-border">
        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4 shadow-sm">
          <Info size={24} />
        </div>
        <h3 className="text-foreground font-bold mb-1">Kosong</h3>
        <p className="text-muted-foreground text-xs">
          Belum ada data {type === "active" ? "peminjaman" : "riwayat"} yang
          ditemukan.
        </p>
      </div>
    );
  }

  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in">
        {loans.map((loan) => (
          <ActiveLoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-card border border-border rounded-[20px] shadow-sm animate-fade-in">
      <table className="w-full text-left border-collapse">
        <thead className="bg-primary text-white">
          <tr className="text-[10px] font-black uppercase tracking-widest">
            <th className="px-6 py-4">Buku</th>
            <th className="px-6 py-4">Tanggal Pinjam</th>
            <th className="px-6 py-4">Tanggal Kembali</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loans.map((loan) => (
            <HistoryTableRow key={loan.id} loan={loan} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ActiveLoanCard = ({ loan }: { loan: LoanData }) => {
  const bibliography = loan.item?.bibliography;
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  const formattedDate = dueDate?.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const toast = useToast();

  // Local state: sudah submit return request di sesi ini
  const [returnPending, setReturnPending] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Hitung sisa hari
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = dueDate ? new Date(dueDate) : null;
  dueDateObj?.setHours(0, 0, 0, 0);
  const daysLeft = dueDateObj ? Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isLate = daysLeft !== null && daysLeft < 0;
  const isWarning = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  const handleReturn = async () => {
    setIsReturning(true);
    const loadingId = toast.loading("Memproses...", "Mengajukan pengembalian ke admin");
    try {
      const res = await loanService.createReturnRequest(loan.id);
      toast.removeToast(loadingId);
      toast.success("Berhasil Diajukan", res.message || "Menunggu konfirmasi dari admin");
      setReturnPending(true);
    } catch (err: any) {
      toast.removeToast(loadingId);
      toast.error("Gagal", err.message || "Gagal mengajukan pengembalian");
    } finally {
      setIsReturning(false);
    }
  };

  const handleExtend = async () => {
    setIsExtending(true);
    const loadingId = toast.loading("Memproses...", "Sedang mengajukan perpanjangan");
    try {
      const res = await loanService.extendLoan(loan.id);
      toast.removeToast(loadingId);
      toast.success("Perpanjangan Berhasil", res.message || "Batas waktu berhasil diperpanjang 7 hari");
    } catch (err: any) {
      toast.removeToast(loadingId);
      toast.error("Perpanjangan Gagal", err.message || "Gagal memperpanjang peminjaman");
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="bg-card rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-border flex gap-5 group hover:shadow-lg transition-all">
      <div className="shrink-0 w-24 h-32 bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center text-muted-foreground">
        {bibliography?.image ? (
          <img
            src={bibliography.image}
            alt={bibliography.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Info size={24} />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-2 leading-tight">
            {bibliography?.title || "Unknown Title"}
          </h4>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">
            {bibliography?.author || "Unknown Author"}
          </p>

          {/* Status jatuh tempo */}
          {daysLeft !== null && (
            <p className={`text-[10px] font-bold mb-3 ${isLate ? "text-primary" : isWarning ? "text-orange-500" : "text-muted-foreground"}`}>
              {isLate
                ? `⚠ Terlambat ${Math.abs(daysLeft)} hari`
                : daysLeft === 0
                  ? "⚠ Jatuh tempo hari ini"
                  : `Jatuh Tempo: ${formattedDate}`}
            </p>
          )}

          {/* Indikator menunggu konfirmasi admin */}
          {returnPending && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-xl mb-2">
              <Clock size={11} className="text-yellow-600 shrink-0" />
              <span className="text-[10px] font-bold text-yellow-700">Menunggu Konfirmasi Admin</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          {/* Tombol Kembalikan */}
          {!returnPending ? (
            <button
              onClick={handleReturn}
              disabled={isReturning || isExtending}
              className="px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isReturning ? (
                <><RefreshCw size={9} className="animate-spin" /> Memproses...</>
              ) : "Kembalikan"}
            </button>
          ) : (
            <div className="px-4 py-1.5 bg-yellow-50 text-yellow-600 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
              <Clock size={9} /> Diajukan
            </div>
          )}

          {/* Tombol Perpanjang — hanya jika tidak terlambat dan belum pernah extend */}
          {loan.status !== "extended" && !isLate && (
            <button
              onClick={handleExtend}
              disabled={isExtending || isReturning || returnPending}
              className="px-4 py-1.5 bg-accent text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isExtending ? (
                <><RotateCcw size={9} className="animate-spin" /> Memproses...</>
              ) : "Perpanjang"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoryTableRow = ({ loan }: { loan: LoanData }) => {
  const bibliography = loan.item?.bibliography;
  const borrowDate = loan.loanDate ? new Date(loan.loanDate) : null;
  const returnDate = loan.returnDate ? new Date(loan.returnDate) : null;

  const STATUS_CONFIG: Record<
    string,
    { label: string; bg: string; text: string }
  > = {
    returned: {
      label: "Tepat Waktu",
      bg: "bg-green-50",
      text: "text-green-600"
    },
    rejected: { label: "Dibatalkan", bg: "bg-accent", text: "text-primary" }
  };

  const status = STATUS_CONFIG[loan.status] || {
    label: loan.status,
    bg: "bg-muted",
    text: "text-foreground"
  };

  return (
    <tr className="text-[11px] font-bold text-foreground hover:bg-muted/50 transition-colors">
      <td className="px-6 py-4">{bibliography?.title || "Unknown Title"}</td>
      <td className="px-6 py-4">
        {borrowDate?.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })}
      </td>
      <td className="px-6 py-4">
        {returnDate?.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }) || "-"}
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 rounded-lg ${status.bg} ${status.text} text-[9px] uppercase tracking-widest`}
        >
          {status.label}
        </span>
      </td>
    </tr>
  );
};

export default RiwayatPeminjaman;
