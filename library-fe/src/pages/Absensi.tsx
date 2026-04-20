import { useState, useEffect } from "react";
import { 
  User, 
  BookOpen, 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  CreditCard,
  Building2,
  GraduationCap,
  FileText
} from "lucide-react";
import { authClient } from "@/utils/auth-client";

const Absensi = () => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState(''); // TAMBAH: identifier/NIM
  const [prodi, setProdi] = useState('');
  const [fakultas, setFakultas] = useState(''); // TAMBAH: faculty
  const [tujuan, setTujuan] = useState(''); // TAMBAH: purpose
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:4000');

  const { data: session } = authClient.useSession();

  // Ambil base URL dari environment variable
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_BETTER_AUTH_URL || 'http://localhost:4000';
    setApiBaseUrl(baseUrl);
    console.log('API Base URL:', baseUrl);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form lengkap
    if (!nama.trim() || !email.trim() || !nim.trim() || !prodi.trim() || !fakultas.trim() || !tujuan.trim()) {
      setStatus({
        type: 'error',
        message: 'Mohon lengkapi semua field (Nama, Email, NIM, Prodi, Fakultas, Tujuan)'
      });
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus({
        type: 'error',
        message: 'Masukkan alamat email yang valid'
      });
      return;
    }

    // Validasi NIM (minimal 8 digit angka)
    const nimRegex = /^[0-9]{8,}$/;
    if (!nimRegex.test(nim)) {
      setStatus({
        type: 'error',
        message: 'Masukkan NIM yang valid (minimal 8 digit angka)'
      });
      return;
    }

    if (!session) {
      setStatus({
        type: 'error',
        message: 'Anda belum login. Silakan login sebagai admin terlebih dahulu.'
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // Payload sesuai dokumentasi API
      const payload = {
        name: nama,
        email: email,
        identifier: nim,      // NIM
        institution: "UMC",   // Default UMC
        faculty: fakultas,    // Fakultas
        major: prodi,         // Program Studi
        purpose: tujuan       // Tujuan kunjungan
      };

      console.log('Mengirim ke:', `${apiBaseUrl}/api/guests`);
      console.log('Payload:', payload);

      const response = await fetch(`${apiBaseUrl}/api/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `Terima kasih ${nama}, kehadiran Anda telah dicatat!`
        });
        
        // Reset form
        setNama('');
        setEmail('');
        setNim('');
        setProdi('');
        setFakultas('');
        setTujuan('');
        
        setTimeout(() => {
          setStatus({ type: null, message: '' });
        }, 3000);
      } else if (response.status === 400) {
        setStatus({
          type: 'error',
          message: data.message || data.error || 'Data tidak lengkap. Periksa kembali input Anda.'
        });
      } else if (response.status === 401) {
        setStatus({
          type: 'error',
          message: 'Sesi login habis. Silakan login kembali.'
        });
      } else {
        throw new Error(data.message || data.error || 'Gagal mencatat kehadiran');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        type: 'error',
        message: 'Terjadi kesalahan. Silakan coba lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const programStudi = [
    { value: '', label: 'Pilih Program Studi' },
    { value: 'Teknik Informatika', label: 'Teknik Informatika' },
    { value: 'Sistem Informasi', label: 'Sistem Informasi' },
    { value: 'Pendidikan', label: 'Pendidikan' },
    { value: 'Manajemen', label: 'Manajemen' },
    { value: 'Hukum', label: 'Hukum' },
  ];

  const daftarFakultas = [
    { value: '', label: 'Pilih Fakultas' },
    { value: 'Fakultas Teknik', label: 'Fakultas Teknik' },
    { value: 'Fakultas Ilmu Komputer', label: 'Fakultas Ilmu Komputer' },
    { value: 'Fakultas Ekonomi', label: 'Fakultas Ekonomi' },
    { value: 'Fakultas Hukum', label: 'Fakultas Hukum' },
    { value: 'Fakultas Keguruan', label: 'Fakultas Keguruan dan Ilmu Pendidikan' },
  ];

  const daftarTujuan = [
    { value: '', label: 'Pilih Tujuan Kunjungan' },
    { value: 'Membaca Buku', label: 'Membaca Buku' },
    { value: 'Meminjam Buku', label: 'Meminjam Buku' },
    { value: 'Mengembalikan Buku', label: 'Mengembalikan Buku' },
    { value: 'Studi Kelompok', label: 'Studi Kelompok' },
    { value: 'Mencari Referensi', label: 'Mencari Referensi' },
    { value: 'Mengerjakan Tugas', label: 'Mengerjakan Tugas' },
    { value: 'Lainnya', label: 'Lainnya' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-[500px] w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#a31d1d] p-6 text-center text-white">
          <div className="inline-block p-3 bg-white/20 rounded-full mb-3">
            <BookOpen size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold tracking-wide">Absensi Perpustakaan</h1>
          <p className="text-xs opacity-80 font-light text-white">Silakan isi data kunjungan Anda</p>
        </div>

        {/* Form */}
        <div className="p-6">
          {status.type && (
            <div className={`mb-5 p-3 rounded-xl flex items-center gap-2 text-sm ${
              status.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-xs font-medium">{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Nama Mahasiswa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-lg text-black text-sm font-medium focus:ring-2 focus:ring-red-100 focus:border-[#a31d1d] outline-none transition-all"
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Email Mahasiswa <span className="text-red-500">*</span>
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
                  placeholder="Masukkan email (contoh: mahasiswa@umc.ac.id)"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* NIM / Identifier */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                NIM / Nomor Induk <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CreditCard size={16} />
                </div>
                <input
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-lg text-black text-sm font-medium focus:ring-2 focus:ring-red-100 focus:border-[#a31d1d] outline-none transition-all"
                  placeholder="Masukkan NIM (contoh: 20220010001)"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Fakultas */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fakultas <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Building2 size={16} />
                </div>
                <select
                  value={fakultas}
                  onChange={(e) => setFakultas(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-lg text-black text-sm font-medium focus:ring-2 focus:ring-red-100 focus:border-[#a31d1d] outline-none transition-all appearance-none cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {daftarFakultas.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Program Studi */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Program Studi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <GraduationCap size={16} />
                </div>
                <select
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-lg text-black text-sm font-medium focus:ring-2 focus:ring-red-100 focus:border-[#a31d1d] outline-none transition-all appearance-none cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {programStudi.map((ps) => (
                    <option key={ps.value} value={ps.value}>
                      {ps.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tujuan Kunjungan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tujuan Kunjungan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FileText size={16} />
                </div>
                <select
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-lg text-black text-sm font-medium focus:ring-2 focus:ring-red-100 focus:border-[#a31d1d] outline-none transition-all appearance-none cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {daftarTujuan.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
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
                  Memproses...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Kirim Kehadiran
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