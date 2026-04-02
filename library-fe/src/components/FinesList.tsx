import { useEffect, useState } from "react";
import { Info, AlertCircle } from "lucide-react";
import fineService, { type Fine } from "@/services/fineService";

const FinesList = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFines = async () => {
      try {
        setLoading(true);
        const data = await fineService.getMyFines();
        setFines(data);
      } catch (err) {
        console.error("Fetch fines error:", err);
        setError("Gagal memuat daftar denda");
      } finally {
        setLoading(false);
      }
    };

    fetchFines();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center animate-pulse">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mb-4"></div>
        <p className="text-slate-400 font-medium italic">
          Memuat data denda...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center bg-red-50 rounded-2xl border border-red-100 p-6">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-800 font-bold mb-1">Gagal Memuat Denda</h3>
        <p className="text-red-700/80 text-xs">{error}</p>
      </div>
    );
  }

  if (fines.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 animate-fade-in">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
          <Info size={24} />
        </div>
        <h3 className="text-slate-600 font-bold mb-1">Tidak Ada Denda</h3>
        <p className="text-slate-400 text-xs">
          Mantap! Kamu tidak memiliki tunggakan denda saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Table View (Mockup Style) */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-[20px] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#9c1b1b] text-white">
            <tr className="text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Buku</th>
              <th className="px-6 py-4">Tanggal Pinjam</th>
              <th className="px-6 py-4">Besar Denda</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {fines.map((fine) => {
              const bookTitle =
                fine.loan?.item?.collection?.title || "Unknown Title";
              const borrowDate = fine.loan?.loanDate
                ? new Date(fine.loan.loanDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "-";

              return (
                <tr
                  key={fine.id}
                  className="text-[11px] font-bold text-slate-600 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">{bookTitle}</td>
                  <td className="px-6 py-4">{borrowDate}</td>
                  <td className="px-6 py-4 text-slate-900">
                    Rp. {fine.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-1.5 rounded-lg text-[9px] uppercase tracking-widest transition-colors ${
                        fine.status === "paid"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {fine.status === "paid"
                        ? "Sudah Dibayar"
                        : "Belum di Bayar"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-red-50 p-6 rounded-[24px] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-red-900 font-black text-sm mb-1 uppercase tracking-tight">
            Total Tunggakan
          </h4>
          <p className="text-2xl font-black text-red-700">
            Rp.{" "}
            {fines
              .filter((f) => f.status === "unpaid")
              .reduce((total, f) => total + f.amount, 0)
              .toLocaleString("id-ID")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-red-700/60 font-bold mb-4 uppercase tracking-widest max-w-[300px]">
            Silahkan hubungi petugas perpustakaan di meja administrasi untuk
            pelunasan denda.
          </p>
          <button className="bg-red-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-red-200">
            BAGAIMANA CARA BAYAR?
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinesList;
