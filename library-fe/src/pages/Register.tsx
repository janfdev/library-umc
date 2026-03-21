// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "@/utils/auth-client";
import { Mail, Lock, User, UserCircle2, ArrowLeft, Loader2 } from "lucide-react";
import Notification from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { notifications, success, error, loading, removeToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Hapus error spesifik field saat mengetik
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Nama harus diisi";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Nama minimal 2 karakter";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Nama maksimal 100 karakter";
    }

    if (!formData.email) {
      errors.email = "Email harus diisi";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Format email tidak valid";
      }
    }

    if (!formData.password) {
      errors.password = "Password harus diisi";
    } else if (formData.password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    } else if (formData.password.length > 128) {
      errors.password = "Password maksimal 128 karakter";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Password tidak cocok";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      error("Form Tidak Valid", "Periksa kembali data yang Anda isi.", 4000);
      return;
    }

    const loadingId = loading("Mendaftarkan...", "Mohon tunggu sebentar");
    setIsLoading(true);

    try {
      // Gunakan authClient.signUp.email() agar better-auth yang handle:
      //   1. Registrasi user & simpan ke DB via better-auth
      //   2. Set cookie session otomatis setelah register
      //   3. Konsisten dengan Google SSO — tidak perlu custom fetch
      const { data, error: authError } = await authClient.signUp.email({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      removeToast(loadingId);

      if (authError) {
        const msg = authError.message ?? "";
        if (
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("exist") ||
          msg.toLowerCase().includes("duplicate") ||
          msg.toLowerCase().includes("taken")
        ) {
          throw new Error("Email sudah terdaftar. Gunakan email lain atau login.");
        }
        throw new Error(msg || "Gagal mendaftar. Silakan coba lagi.");
      }

      if (data?.user) {
        success("Registrasi Berhasil! 🎉", "Akun Anda berhasil dibuat. Silakan login.", 4000);
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err: unknown) {
      removeToast(loadingId);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan jaringan. Periksa koneksi internet Anda.";
      error("Registrasi Gagal", errorMessage, 6000);
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
        {notifications.map((toast) => (
          <Notification
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

        {/* Header dengan Gradasi */}
        <div className="bg-gradient-to-br from-[#B21F24] to-[#8a181b] pt-10 pb-12 px-6 text-center relative">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <UserCircle2 className="text-white w-10 h-10" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
          <p className="text-white/80 text-sm mt-1">Perpustakaan Digital Universitas Muhammadiyah Cirebon</p>
          {/* Curve Decor */}
          <div className="absolute -bottom-1 left-0 right-0 h-6 bg-white rounded-t-[32px]"></div>
        </div>

        <div className="px-8 pb-10 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Field */}
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold ml-1">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#B21F24] transition-colors" size={18} />
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className={`w-full pl-11 pr-4 h-12 bg-slate-50 border rounded-2xl outline-none text-slate-900 text-sm transition-all focus:ring-4 focus:ring-[#B21F24]/5 focus:bg-white ${
                    validationErrors.name ? 'border-red-300 bg-red-50/50' : 'border-slate-200 focus:border-[#B21F24]'
                  }`}
                  required
                />
              </div>
              {validationErrors.name && (
                <p className="text-red-500 text-[10px] font-medium ml-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#B21F24] transition-colors" size={18} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh@student.umc.ac.id"
                  className={`w-full pl-11 pr-4 h-12 bg-slate-50 border rounded-2xl outline-none text-slate-900 text-sm transition-all focus:ring-4 focus:ring-[#B21F24]/5 focus:bg-white ${
                    validationErrors.email ? 'border-red-300 bg-red-50/50' : 'border-slate-200 focus:border-[#B21F24]'
                  }`}
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-[10px] font-medium ml-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#B21F24] transition-colors" size={18} />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 karakter"
                    className={`w-full pl-11 pr-4 h-12 bg-slate-50 border rounded-2xl outline-none text-slate-900 text-sm transition-all focus:ring-4 focus:ring-[#B21F24]/5 focus:bg-white ${
                      validationErrors.password ? 'border-red-300 bg-red-50/50' : 'border-slate-200 focus:border-[#B21F24]'
                    }`}
                    required
                  />
                </div>
                {validationErrors.password && (
                  <p className="text-red-500 text-[10px] font-medium ml-1">{validationErrors.password}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold ml-1">Konfirmasi</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#B21F24] transition-colors" size={18} />
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    className={`w-full pl-11 pr-4 h-12 bg-slate-50 border rounded-2xl outline-none text-slate-900 text-sm transition-all focus:ring-4 focus:ring-[#B21F24]/5 focus:bg-white ${
                      validationErrors.confirmPassword ? 'border-red-300 bg-red-50/50' : 'border-slate-200 focus:border-[#B21F24]'
                    }`}
                    required
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-500 text-[10px] font-medium ml-1">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold shadow-lg shadow-slate-200 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-[#B21F24] text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Sudah punya akun? Masuk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;