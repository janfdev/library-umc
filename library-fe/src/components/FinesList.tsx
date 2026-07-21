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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mb-4"></div>
        <p className="text-muted-foreground font-medium italic">
          Memuat data denda...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center bg-accent rounded-2xl border border-primary p-6">
        <AlertCircle className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="text-primary font-bold mb-1">Gagal Memuat Denda</h3>
        <p className="text-primary/80 text-xs">{error}</p>
      </div>
    );
  }

  if (fines.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-border animate-fade-in">
        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4 shadow-sm">
          <Info size={24} />
        </div>
        <h3 className="text-foreground font-bold mb-1">Tidak Ada Denda</h3>
        <p className="text-muted-foreground text-xs">
          Mantap! Kamu tidak memiliki tunggakan denda saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Table View (Mockup Style) */}
      <div className="overflow-hidden bg-card border border-border rounded-[20px] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-primary text-white">
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
                : fine.loan?.dueDate
                  ? new Date(fine.loan.dueDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })
                  : "-";

              return (
                <tr
                  key={fine.id}
                  className="text-[11px] font-bold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">{bookTitle}</td>
                  <td className="px-6 py-4">{borrowDate}</td>
                  <td className="px-6 py-4 text-foreground">
                    Rp. {fine.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-1.5 rounded-lg text-[9px] uppercase tracking-widest transition-colors ${
                        fine.status === "paid"
                          ? "bg-green-50 text-green-600"
                          : "bg-accent text-primary"
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

      <div className="mt-8 bg-accent p-6 rounded-[24px] border border-primary flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-primary font-black text-sm mb-1 uppercase tracking-tight">
            Total Tunggakan
          </h4>
          <p className="text-2xl font-black text-primary">
            Rp.{" "}
            {fines
              .filter((f) => f.status === "unpaid")
              .reduce((total, f) => total + f.amount, 0)
              .toLocaleString("id-ID")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-primary/60 font-bold mb-4 uppercase tracking-widest max-w-[300px]">
            Silahkan hubungi petugas perpustakaan di meja administrasi untuk
            pelunasan denda.
          </p>
          <button className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary">
            BAGAIMANA CARA BAYAR?
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinesList;
