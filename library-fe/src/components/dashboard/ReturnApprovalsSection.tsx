import { useState, useEffect } from "react";
import { CheckCircle, Clock, BookOpen,} from "lucide-react";
import loanService from "@/services/loanService";
import { useToast } from "@/hooks/useToast";

export default function ReturnApprovalsSection() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const toast = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await loanService.getPendingReturnRequests();
      setRequests(data || []);
    } catch (err: any) {
      toast.error("Gagal", err.message || "Gagal memuat persetujuan pengembalian");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    const loadingId = toast.loading("Memproses...", "Menyetujui pengembalian...");
    try {
      const res = await loanService.approveReturnRequest(requestId);
      toast.removeToast(loadingId);
      toast.success("Berhasil", res.message || "Pengembalian berhasil disetujui");
      fetchRequests();
    } catch (err: any) {
      toast.removeToast(loadingId);
      toast.error("Gagal", err.message || "Gagal menyetujui pengembalian");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium animate-pulse">
        Memuat data persetujuan pengembalian...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">Persetujuan Pengembalian</h2>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center">
          <CheckCircle size={48} className="text-green-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Tidak ada pengajuan pengembalian</h3>
          <p className="text-sm text-slate-400 mt-2">Semua buku yang dikembalikan telah diproses.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-[15px]">{req.loan?.item?.collection?.title}</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">
                    Oleh: {req.loan?.member?.user?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-bold">
                    <Clock size={12} />
                    Batas Kembali: {new Date(req.loan?.dueDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={processingId === req.id}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 transition-colors"
                >
                  {processingId === req.id ? "Memproses..." : "Konfirmasi Pengembalian"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
