import { useState } from "react";
import { X, Mail, Info } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddGuestModal({ isOpen, onClose, onRefresh }: AddGuestModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Masukkan alamat email yang valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (data.success) {
        onRefresh();
        onClose();
        setEmail("");
      } else {
        setErrorMsg(data.message || "Gagal mencatat pengunjung. Pastikan email terdaftar di sistem kampus.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("Terjadi kesalahan sistem. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-card w-full max-w-[480px] rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="bg-card px-6 py-5 flex items-center justify-between">
          <h2 className="text-white text-[16px] font-bold tracking-wide">Catat Pengunjung Manual</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-5 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700 font-medium leading-relaxed">
            Masukkan email pengunjung yang terdaftar di sistem kampus UMC. Data nama, fakultas, dan NIM akan diambil otomatis.
          </p>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-extrabold text-[#0F172A] mb-2">
              Email Pengunjung <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                placeholder="contoh: mahasiswa@umc.ac.id"
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-[14px] focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-semibold text-slate-800 placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-warning-bg border border-warning-border rounded-xl px-4 py-3">
              <p className="text-[12px] text-destructive font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-border text-muted-foreground rounded-xl text-sm font-bold hover:bg-surface-hover transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Mencatat..." : "Catat Kehadiran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
