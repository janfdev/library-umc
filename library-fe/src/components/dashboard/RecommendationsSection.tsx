import { useState, useEffect } from "react";
import {
  BookMarked,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  User,
  ChevronDown,
  FileText
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { formatDateID } from "@/utils/format";

interface Recommendation {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  dosenId: string;
  dosen?: {
    name: string;
    email: string;
  };
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);


  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`${API_BASE_URL}/api/recommendations${statusParam}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data);
      } else {
        setError(data.message || "Gagal memuat data");
      }
    } catch (err) {
      console.error(err);
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    const loadingId = toast.loading("Memproses...", `Mengubah status menjadi ${status}`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      toast.removeToast(loadingId);
      if (data.success) {
        toast.success("Berhasil", `Rekomendasi telah ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
        fetchRecommendations();
      } else {
        toast.error("Gagal", data.message || "Gagal memperbarui status");
      }
    } catch {
      toast.removeToast(loadingId);
      toast.error("Error", "Gagal terhubung ke server");
    }
  };

  const filteredData = recommendations.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.dosen?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock, text: "Menunggu" },
      approved: { color: "bg-green-100 text-green-700", icon: CheckCircle, text: "Disetujui" },
      rejected: { color: "bg-red-100 text-red-700", icon: XCircle, text: "Ditolak" },
    }[status] || { color: "bg-gray-100 text-gray-700", icon: Clock, text: status };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${config.color}`}>
        <Icon size={14} /> {config.text}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Header */}
        <div className="p-6 md:px-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold text-[#0F172A] tracking-tight">Usulan Pengadaan Koleksi</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">Rekomendasi buku baru dari dosen untuk perpustakaan</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterStatus)}
                className="appearance-none bg-[#F8FAFC] border-none rounded-xl pl-4 pr-10 py-2.5 text-[13px] font-bold text-slate-600 focus:ring-2 focus:ring-red-500/10 cursor-pointer min-w-[160px]"
              >
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
                <option value="all">Semua</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari buku atau dosen..."
                className="w-full md:w-64 pl-11 pr-4 py-2.5 bg-[#F8FAFC] border-none rounded-xl text-[13px] font-medium text-slate-600 focus:ring-2 focus:ring-red-500/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3">
              <XCircle size={16} />
              {error}
            </div>
          )}
          {loading ? (

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full rounded-[20px]" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400">
              <BookMarked className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-sm font-bold">Tidak ada data rekomendasi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#F8FAFC] rounded-[20px] p-6 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Info Buku */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                            <BookMarked className="text-slate-400 group-hover:text-[#B91C1C]" size={18} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[#0F172A] text-[15px]">{item.title}</h4>
                            <p className="text-[13px] text-slate-500 font-medium">{item.author}</p>
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100">
                          <User size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengusul (Dosen)</p>
                            <p className="text-[13px] font-bold text-slate-700">{item.dosen?.name || "Unknown"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100">
                          <FileText size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Diajukan</p>
                            <p className="text-[13px] font-bold text-slate-700">{formatDateID(item.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alasan Pengadaan</p>
                        <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">"{item.reason}"</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {item.status === 'pending' && (
                      <div className="flex flex-row md:flex-col gap-2 justify-end">
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'approved')}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/10"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'rejected')}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-white text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
