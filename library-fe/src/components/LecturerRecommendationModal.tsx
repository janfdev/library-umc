import { useState } from "react";
import { BookMarked, X, Send, Loader2, Info } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";
import { useToast } from "@/hooks/useToast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LecturerRecommendationModal({
  isOpen,
  onClose
}: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    reason: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.reason) {
      toast.warning(
        "Data Belum Lengkap",
        "Judul, Penulis, dan Alasan wajib diisi."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Berhasil", "Usulan koleksi berhasil diajukan.");
        setFormData({
          isbn: "",
          title: "",
          author: "",
          publisher: "",
          reason: ""
        });
        onClose();
      } else {
        toast.error("Gagal", data.message || "Gagal mengajukan usulan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-primary p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookMarked size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Usulan Koleksi Baru</h3>
              <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider">
                Hanya untuk Dosen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 border border-blue-100">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
            <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
              Buku yang diusulkan akan direview oleh tim perpustakaan untuk
              proses pengadaan selanjutnya.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                ISBN (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: 978-3-16-148410-0"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
              />
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                Membantu identifikasi buku yang lebih akurat
              </p>
            </div>

            <div>
              <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Judul Buku *
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Pemrograman Web Modern"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Penulis *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Nama Penulis"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Penerbit
                </label>
                <input
                  type="text"
                  placeholder="Opsional"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.publisher}
                  onChange={(e) =>
                    setFormData({ ...formData, publisher: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Alasan Pengadaan *
              </label>
              <textarea
                required
                placeholder="Contoh: Digunakan sebagai referensi mata kuliah X semester gasal."
                rows={3}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-muted text-foreground rounded-2xl text-[13px] font-bold hover:bg-muted transition-all"
            >
              Batal
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-[2] py-3.5 bg-primary text-white rounded-2xl text-[13px] font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {loading ? "MENGIRIM..." : "KIRIM USULAN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
