import { useState } from "react";
import {
  BookOpen,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Info
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

const Absensi = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    guestName?: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setStatus({
        type: 'error',
        message: 'Masukkan alamat email yang valid (contoh: mahasiswa@umc.ac.id)'
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: trimmedEmail })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const guestName = data.data?.name || trimmedEmail;
        setStatus({
          type: 'success',
          message: `Terima kasih, kehadiran Anda telah dicatat!`,
          guestName
        });
        setEmail('');

        setTimeout(() => {
          setStatus({ type: null, message: '' });
        }, 5000);
      } else if (response.status === 400) {
        // Could be "already checked in today" or validation error
        const msg = data.message || 'Data tidak valid. Periksa kembali email Anda.';
        if (msg.toLowerCase().includes('already')) {
          setStatus({
            type: 'error',
            message: 'Anda sudah tercatat hadir hari ini. Sampai jumpa besok!'
          });
        } else {
          setStatus({ type: 'error', message: msg });
        }
      } else if (response.status === 401) {
        setStatus({
          type: 'error',
          message: 'Sesi tidak terotorisasi. Silakan hubungi petugas perpustakaan.'
        });
      } else if (response.status === 404) {
        setStatus({
          type: 'error',
          message: 'Email tidak ditemukan di sistem kampus. Pastikan menggunakan email UMC yang terdaftar.'
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Gagal mencatat kehadiran. Coba lagi.'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        type: 'error',
        message: 'Terjadi kesalahan koneksi. Silakan coba lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-[480px] w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#a31d1d] p-8 text-center text-white">
          <div className="inline-block p-3 bg-white/20 rounded-full mb-3">
            <BookOpen size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold tracking-wide">Absensi Perpustakaan</h1>
          <p className="text-xs opacity-80 font-light mt-1">Universitas Muhammadiyah Cirebon</p>
        </div>

        {/* Form */}
        <div className="p-6">

          {/* Info Banner */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              Masukkan email kampus Anda. Data NIM, fakultas, dan prodi akan diambil otomatis dari sistem.
            </p>
          </div>

          {/* Status message */}
          {status.type && (
            <div className={`mb-5 p-4 rounded-xl flex items-start gap-2.5 text-sm ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success'
                ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
                : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <div>
                {status.type === 'success' && status.guestName && (
                  <p className="font-bold text-[13px] mb-0.5">Halo, {status.guestName}! 👋</p>
                )}
                <span className="text-xs font-medium">{status.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Email Kampus <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-lg text-black text-sm font-medium focus:ring-2 focus:ring-red-100 focus:border-[#a31d1d] outline-none transition-all"
                  placeholder="contoh: mahasiswa@umc.ac.id"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0f172a] hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg mt-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
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

          <p className="text-center text-[9px] text-gray-400 mt-5 uppercase tracking-widest">
            Koleksi Digital UMC • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Absensi;