import { useEffect, useState } from "react";
import { AlertCircle, Info } from "lucide-react";
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mb-4"></div>
        <p className="text-slate-400 font-medium italic">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center bg-red-50 rounded-2xl border border-red-100 p-6">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-800 font-bold mb-1">Terjadi Kesalahan</h3>
        <p className="text-red-700/80 text-xs">{error}</p>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
          <Info size={24} />
        </div>
        <h3 className="text-slate-600 font-bold mb-1">Kosong</h3>
        <p className="text-slate-400 text-xs">
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
    <div className="overflow-hidden bg-white border border-slate-100 rounded-[20px] shadow-sm animate-fade-in">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#9c1b1b] text-white">
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
  const collection = loan.item?.collection;
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  const formattedDate = dueDate?.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const toast = useToast();

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex gap-5 group hover:shadow-lg transition-all">
      <div className="shrink-0 w-24 h-32 bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center text-slate-400">
        {collection?.image ? (
          <img
            src={collection.image}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Info size={24} orientation="vertical" />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2 leading-tight">
            {collection?.title || "Unknown Title"}
          </h4>
          <p className="text-[10px] font-medium text-slate-400 mb-4">
            {collection?.author || "Unknown Author"}
          </p>
          {formattedDate && (
            <p className="text-[10px] font-bold text-slate-400">
              Jatuh Tempo :{" "}
              <span className="text-slate-500">{formattedDate}</span>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                const loadingId = toast.loading("Memproses...", "Mengajukan pengembalian");
                try {
                  const res = await loanService.createReturnRequest(loan.id);
                  toast.removeToast(loadingId);
                  toast.success("Berhasil", res.message);
                } catch (err: any) {
                  toast.removeToast(loadingId);
                  toast.error("Gagal", err.message || "Gagal mengajukan pengembalian");
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors"
          >
            Kembalikan
          </button>
          <button className="px-4 py-1.5 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-100 transition-colors">
            Perpanjang
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryTableRow = ({ loan }: { loan: LoanData }) => {
  const collection = loan.item?.collection;
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
    rejected: { label: "Dibatalkan", bg: "bg-red-50", text: "text-red-600" }
  };

  const status = STATUS_CONFIG[loan.status] || {
    label: loan.status,
    bg: "bg-slate-50",
    text: "text-slate-600"
  };

  return (
    <tr className="text-[11px] font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">{collection?.title || "Unknown Title"}</td>
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
