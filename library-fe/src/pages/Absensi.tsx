import { useState } from "react";
import {
  BookOpen,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Info,
  Backpack
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

const Absensi = () => {
  const [name, setName] = useState("");
  const [prodi, setProdi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    guestName?: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedProdi = prodi.trim();

    if (!trimmedName) {
      setStatus({
        type: "error",
        message: "Masukkan nama Anda terlebih dahulu."
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch(`${API_BASE_URL}/api/guest/absensi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ name: trimmedName, major: trimmedProdi })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const guestName = data.data?.newAbsensi?.name || trimmedName;
        setStatus({
          type: "success",
          message: `Terima kasih, kehadiran Anda telah dicatat!`,
          guestName
        });
        setName("");
        setProdi("");

        setTimeout(() => {
          setStatus({ type: null, message: "" });
        }, 5000);
      } else {
        setStatus({
          type: "error",
          message: data.message || "Gagal mencatat kehadiran. Coba lagi."
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        type: "error",
        message: "Terjadi kesalahan koneksi. Silakan coba lagi."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-120 w-full bg-card rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-8 text-center text-primary-foreground">
          <div className="inline-block p-3 bg-white/20 rounded-full mb-3">
            <BookOpen size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold tracking-wide">
            Absensi Perpustakaan
          </h1>
          <p className="text-xs opacity-80 font-light mt-1">
            Universitas Muhammadiyah Cirebon
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {/* Info Banner */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              Masukkan email dan nama anda
            </p>
          </div>

          {/* Status message */}
          {status.type && (
            <div
              className={`mb-5 p-4 rounded-xl flex items-start gap-2.5 text-sm ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              )}
              <div>
                {status.type === "success" && status.guestName && (
                  <p className="font-bold text-[13px] mb-0.5">
                    Halo, {status.guestName}! 👋
                  </p>
                )}
                <span className="text-xs font-medium">{status.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-[11px] font-bold text-foreground mb-1">
                Nama <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  placeholder="contoh: John Doe"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            {/* Program Studi */}
            <div>
              <label className="block text-[11px] font-bold text-foreground mb-1">
                Program Studi <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Backpack size={16} />
                </div>
                <input
                  type="text"
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  placeholder="contoh: Teknik Informatika"
                  required
                  disabled={isLoading}
                  autoComplete="Prodi"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground hover:bg-foreground/90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg mt-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mencatat kehadiran...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Catat Kehadiran
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[9px] text-muted-foreground mt-5 uppercase tracking-widest">
            Koleksi Digital UMC • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Absensi;
