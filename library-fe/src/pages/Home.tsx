// src/pages/Home.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/components/ui/navbar";
import Background from "@/assets/bg1.jpeg";
import DialogUnauthorized from "@/components/DialogUnauthorized";
import Footer from "@/components/Footer";
import BookList from "@/components/BookList";
import { authClient } from "@/utils/auth-client";
import LecturerRecommendationModal from "@/components/LecturerRecommendationModal";
import { BookMarked } from "lucide-react";
import type { AuthUser } from "@/types/auth";

export default function Home() {
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");

  const { data: session } = authClient.useSession();
  const user = session?.user as AuthUser | undefined;
  const isLecturer = user?.role === "lecturer" || user?.role === "super_admin";
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle search and redirect to Katalog page
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert("Silakan masukkan kata kunci pencarian");
      return;
    }

    // Navigate to Katalog page with search parameters
    navigate(
      `/katalog?search=${encodeURIComponent(searchQuery)}&type=${searchType}`
    );
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div>
        <div className="absolute w-full">
          <Navbar />
          <DialogUnauthorized />
        </div>

        {/* Hero Section with Search */}
        <div
          className="flex w-full h-screen items-center justify-center text-center"
          style={{
            backgroundImage: `url(${Background})`, // Fixed: missing closing parenthesis
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          <div className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white space-y-2">
              <h1>
                Perpustakaan
                <br /> Universitas Muhammadiyah Cirebon
              </h1>
              <p className="text-base sm:text-lg font-normal">
                Akses koleksi buku, jurnal, dan e-book resmi UMC
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mt-6 w-full sm:max-w-2xl">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {/* Input Search & Dropdown */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Cari Judul, penulis, ISBN..."
                      className="w-full px-4 py-2.5 sm:py-3 pl-10 border text-sm sm:text-base text-black border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute left-3 top-3.5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-4 py-2.5 sm:py-3 border text-sm sm:text-base text-black border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">Semua</option>
                    <option value="title">Judul</option>
                    <option value="author">Penulis</option>
                    <option value="isbn">ISBN</option>
                  </select>
                </div>

                {/* Tombol Telusuri Koleksi */}
                <button
                  onClick={handleSearch}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-medium py-2.5 sm:py-3 px-6 rounded-full transition-colors duration-200 text-sm sm:text-base"
                >
                  Telusuri Koleksi
                </button>
              </div>
            </div>
          </div>

          {/* Floating Button for Lecturer Recommendation */}
          {isLecturer && (
            <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-30">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-2 sm:gap-3 bg-white hover:bg-red-600 text-red-600 hover:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 border-4 border-red-600/10"
              >
                <BookMarked className="group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-xs sm:text-sm tracking-tight uppercase">
                  Usul Koleksi Baru
                </span>
              </button>
            </div>
          )}

          <LecturerRecommendationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </div>

      {/* Pintasan */}
      <div className="w-full p-4 sm:p-6 lg:p-[40px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4 lg:px-16 text-gray-900">
          {/* Card 1 */}
          <a
            href="/katalog"
            className="flex flex-col items-center text-center shadow-lg rounded-lg p-6 bg-white hover:shadow-xl transition-shadow h-full"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60px"
                height="60px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-book-open-text text-red-700 sm:w-[80px] sm:h-[80px]"
              >
                <path d="M12 7v14" />
                <path d="M16 12h2" />
                <path d="M16 8h2" />
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                <path d="M6 12h2" />
                <path d="M6 8h2" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold mt-3 sm:mt-4">
              Katalog Online
            </h2>
            <p className="text-[12px] text-gray-600 mt-2">
              Telusuri koleksi buku dan e-book perpustakaan UMC
            </p>
          </a>

          {/* Card 2 */}
          <a
            href="e-resource"
            className="flex flex-col items-center text-center shadow-lg rounded-lg p-4 sm:p-6 bg-white hover:shadow-xl transition-shadow h-full"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60px"
                height="60px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-file-minus text-red-700 sm:w-[80px] sm:h-[80px]"
              >
                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                <path d="M9 15h6" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold mt-3 sm:mt-4">
              Repositori Digital
            </h2>
            <p className="text-[10px] sm:text-[12px] text-gray-600 mt-2">
              Akses jurnal, skripsi, dan publikasi ilmiah UMC
            </p>
          </a>

          {/* Card 3 */}
          <a
            href="#"
            className="flex flex-col items-center text-center shadow-lg rounded-lg p-4 sm:p-6 bg-white hover:shadow-xl transition-shadow h-full"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60px"
                height="60px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-map-pinned-icon lucide-map-pinned text-red-700 sm:w-[80px] sm:h-[80px]"
              >
                <path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0" />
                <circle cx="12" cy="8" r="2" />
                <path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold mt-3 sm:mt-4">
              Informasi Lokasi
            </h2>
            <p className="text-[10px] sm:text-[12px] text-gray-600 mt-2">
              Temukan lokasi perpustakaan dan fasilitasnya
            </p>
          </a>

          {/* Card 4 */}
          <a
            href="/katalog"
            className="flex flex-col items-center text-center shadow-lg rounded-lg p-4 sm:p-6 bg-white hover:shadow-xl transition-shadow h-full"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60px"
                height="60px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-book-plus-icon lucide-book-plus text-red-700 sm:w-[80px] sm:h-[80px]"
              >
                <path d="M12 7v6" />
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                <path d="M9 10h6" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold mt-3 sm:mt-4">
              Koleksi Terbaru
            </h2>
            <p className="text-[10px] sm:text-[12px] text-gray-600 mt-2">
              Lihat koleksi buku terbaru yang tersedia
            </p>
          </a>
        </div>
      </div>

      {/* Daftar buku dan Ebook */}
      <div className="p-4 sm:p-6 lg:p-[50px] flex justify-center">
        <BookList />
      </div>

      {/* Footer */}
      <div>
        <Footer />
      </div>
    </div>
  );
}
