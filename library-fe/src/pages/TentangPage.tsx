import { MapPin, Clock, Phone, Mail, MapPinned } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-linear-to-r from-red-600 to-red-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">
            Informasi Lokasi Perpustakaan
          </h1>
          <p className="text-red-100">
            Akses alamat lengkap dan peta lokasi perpustakaan UMC
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Perpustakaan Universitas Muhammadiyah Cirebon
              </h2>

              {/* Address Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Alamat
                </h3>
                <p className="text-gray-600 leading-relaxed ml-7">
                  <strong>Gedung Djuanda - Lantai 7</strong>
                  <br />
                  Kampus 2 UMC
                  <br />
                  Jl. Fatahillah - Watubelah No. 40
                  <br />
                  Kecamatan Sumber
                  <br />
                  Kabupaten Cirebon, Jawa Barat
                </p>
              </div>

              {/* Operating Hours Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  Jam Operasional
                </h3>
                <div className="ml-7 space-y-2 text-gray-600">
                  <p>
                    <strong>Senin - Jumat:</strong> 08:00 - 16:00 WIB
                  </p>
                  <p>
                    <strong>Sabtu:</strong> 08:00 - 12:00 WIB
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Hubungi Kami
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-600 flex items-start gap-3">
                    <Phone className="w-5 h-5 text-red-600 mt-0.5" />
                    <span>(0231) 206608, 206617</span>
                  </p>
                  <p className="text-gray-600 flex items-start gap-3">
                    <Mail className="w-5 h-5 text-red-600 mt-0.5" />
                    <span>perpustakaan@umc.ac.id</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-96 flex flex-col">
              {/* Embed Google Map */}
              <iframe
                title="UMC Library Location"
                width="100%"
                height="100%"
                frameBorder="0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.456789123456!2d108.48791!3d-6.70234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6eee99aabbbbbb%3A0xabcdef123456789!2sUniversitas%20Muhammadiyah%20Cirebon!5e0!3m2!1sen!2sid!4v1234567890123"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="flex-1"
              ></iframe>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-red-600" />
                Panduan Pengunjung
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>
                    Harap menunjukkan kartu anggota saat memasuki perpustakaan
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Parkir tersedia di area kampus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Fasilitas WiFi tersedia untuk semua pengunjung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>
                    Area belajar nyaman dengan AC dan pencahayaan baik
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Tentang Perpustakaan UMC
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border-l-4 border-red-600">
              <h3 className="font-semibold text-gray-800 mb-2">Koleksi Buku</h3>
              <p className="text-gray-600 text-sm">
                Perpustakaan UMC memiliki ribuan judul buku dari berbagai bidang
                ilmu untuk mendukung pembelajaran mahasiswa.
              </p>
            </div>
            <div className="p-6 border-l-4 border-red-600">
              <h3 className="font-semibold text-gray-800 mb-2">E-Resource</h3>
              <p className="text-gray-600 text-sm">
                Akses digital koleksi jurnal, e-book, dan database akademik yang
                tersedia untuk komunitas UMC.
              </p>
            </div>
            <div className="p-6 border-l-4 border-red-600">
              <h3 className="font-semibold text-gray-800 mb-2">
                Layanan Referensi
              </h3>
              <p className="text-gray-600 text-sm">
                Tim pustakawan siap membantu Anda menemukan informasi dan
                menggunakan sumber daya perpustakaan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
