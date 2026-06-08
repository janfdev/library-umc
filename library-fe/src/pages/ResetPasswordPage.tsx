import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authClient } from "@/utils/auth-client";
import { Lock, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { success, error, loading, removeToast } = useToast();

  useEffect(() => {
    // Jika tidak ada token di URL, redirect ke forgot password
    if (!token) {
      error("Token Tidak Valid", "Link reset password tidak valid atau sudah kedaluwarsa.");
      navigate("/forgot-password");
    }
  }, [token, navigate, error]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (newPassword.length < 8) {
      error("Password Terlalu Pendek", "Kata sandi harus minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      error("Password Tidak Cocok", "Konfirmasi kata sandi tidak sama dengan kata sandi baru.");
      return;
    }

    const loadingId = loading("Menyimpan...", "Sedang memperbarui kata sandi Anda...");
    setIsLoading(true);

    try {
      const { error: authError } = await authClient.resetPassword({
        newPassword,
        token, // Secara otomatis ditangkap oleh better-auth atau bisa diparsing manual tergantung versi,
                 // tetapi kita pass explisit untuk keamanan.
      });

      removeToast(loadingId);

      if (authError) {
        throw new Error(authError.message || "Gagal mereset kata sandi. Link mungkin sudah kedaluwarsa.");
      }

      setIsSuccess(true);
      success("Berhasil!", "Kata sandi Anda telah berhasil diperbarui.", 3000);
      
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      removeToast(loadingId);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.";
      error("Reset Gagal", msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Latar Belakang Lingkaran */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#0F172A]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-[#B21F24]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-[#0F172A] pt-8 pb-10 px-6 text-center relative">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-2xl shadow-inner border border-white/5">
              <ShieldCheck className="text-emerald-400 w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold tracking-wide">Buat Sandi Baru</h1>
          <p className="text-gray-400 text-[13px] mt-2 max-w-[280px] mx-auto leading-relaxed">
            Sandi baru Anda harus unik dan berbeda dari sandi yang digunakan sebelumnya.
          </p>
          
          <div className="absolute -bottom-1 left-0 right-0 h-6 bg-white" style={{ borderRadius: "24px 24px 0 0" }}></div>
        </div>

        <div className="px-8 pb-10 pt-2">
          {isSuccess ? (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle2 className="text-green-600 w-12 h-12" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Sandi Berhasil Diperbarui!</h3>
                <p className="text-sm text-gray-500">Anda akan diarahkan ke halaman login dalam beberapa detik...</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-11 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-[13px] shadow-md transition-all active:scale-[0.98]"
              >
                Langsung ke Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Password Baru */}
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0F172A]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-11 pr-4 h-12 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] outline-none text-[13px] text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                  Konfirmasi Sandi Baru
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0F172A]">
                    <CheckCircle2 size={16} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-11 pr-4 h-12 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] outline-none text-[13px] text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                {/* Visual feedback sederhana */}
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-medium">Kata sandi tidak cocok</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                  <p className="text-green-500 text-[10px] mt-1.5 ml-1 font-medium">Kata sandi cocok</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                className="w-full h-12 bg-[#B21F24] hover:bg-[#961a1e] text-white rounded-xl font-bold text-[13px] shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memperbarui...
                  </>
                ) : (
                  "Simpan Kata Sandi Baru"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
