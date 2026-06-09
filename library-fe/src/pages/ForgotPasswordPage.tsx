import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "@/utils/auth-client";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { success, error, loading, removeToast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      error("Email Kosong", "Silakan masukkan alamat email Anda.");
      return;
    }

    const loadingId = loading("Memproses...", "Sedang mengirim link reset password...");
    setIsLoading(true);

    try {
      const { error: authError } = await authClient.requestPasswordReset({
        email: email.toLowerCase().trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });

      removeToast(loadingId);

      // Sesuai security best practice, jangan beritahu user jika email tidak ditemukan.
      // Better-auth juga secara default mungkin mengembalikan success meskipun email tidak ada
      // untuk mencegah user enumeration.
      if (authError) {
        throw new Error(authError.message || "Terjadi kesalahan. Silakan coba lagi.");
      }

      setIsSuccess(true);
      success(
        "Terkirim!",
        "Jika email Anda terdaftar, instruksi reset password telah dikirim ke inbox Anda.",
        5000
      );
    } catch (err) {
      removeToast(loadingId);
      const msg = err instanceof Error ? err.message : "Gagal memproses permintaan.";
      error("Gagal", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Latar Belakang Lingkaran (opsional, untuk sentuhan desain) */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-[#B21F24]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-[#0F172A]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-[#B21F24] pt-8 pb-10 px-6 text-center relative">
          <button 
            onClick={() => navigate("/login")}
            className="absolute left-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-2xl shadow-inner">
              <KeyRound className="text-white w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold tracking-wide">Lupa Kata Sandi?</h1>
          <p className="text-white/80 text-[13px] mt-2 max-w-[280px] mx-auto leading-relaxed">
            Masukkan email Anda dan kami akan mengirimkan instruksi untuk mengatur ulang sandi.
          </p>
          
          {/* Bentuk pemisah estetis */}
          <div className="absolute -bottom-1 left-0 right-0 h-6 bg-white" style={{ borderRadius: "24px 24px 0 0" }}></div>
        </div>

        <div className="px-8 pb-10 pt-2">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 text-green-800 p-5 rounded-2xl border border-green-100 shadow-sm">
                <p className="text-[13px] font-medium leading-relaxed">
                  Jika email <strong>{email}</strong> terdaftar dengan metode sandi, link reset telah dikirim.
                </p>
                <div className="mt-3 pt-3 border-t border-green-200/60">
                  <p className="text-[11px] text-green-700/80 leading-relaxed">
                    <strong>Catatan:</strong> Jika Anda sebelumnya mendaftar menggunakan Google SSO, fitur reset sandi ini tidak berlaku. Silakan kembali dan masuk langsung menggunakan tombol Google.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => navigate("/login")}
                className="w-full h-11 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-[13px] shadow-sm transition-all active:scale-[0.98]"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                  Alamat Email
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#B21F24]">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-11 pr-4 h-12 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B21F24]/20 focus:border-[#B21F24] outline-none text-[13px] text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-[13px] shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Kirim Link Reset Sandi"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
