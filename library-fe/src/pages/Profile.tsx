import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import RiwayatPeminjaman from "@/components/RiwayatPeminjaman";
import MemberCard from "@/components/MemberCard";
import ReservationList from "@/components/ReservationList";

const Profile = () => {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("riwayat-peminjaman");

  // Redirect ke login jika tidak ada session
  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login');
    }
  }, [session, isPending, navigate]);

  // Data dummy untuk development (akan diganti dengan API nanti)
  const activeLoans = [
    { id: "1", bookTitle: "Basis Data Dasar", loanDate: "1 Februari 2026", returnDate: "8 Februari 2026", status: "Tepat Waktu" },
    { id: "2", bookTitle: "Metode Penelitian", loanDate: "21 Januari 2026", returnDate: "28 Januari 2026", status: "Tepat Waktu" },
    { id: "3", bookTitle: "Pemrograman Dasar", loanDate: "21 Januari 2026", returnDate: "28 Januari 2026", status: "Tepat Waktu" },
  ];

  const loanHistory = [
    { id: "1", bookTitle: "Basis Data Dasar", loanDate: "15 Desember 2025", returnDate: "22 Desember 2025", status: "Tepat Waktu" },
    { id: "2", bookTitle: "Metode Penelitian", loanDate: "5 Desember 2025", returnDate: "12 Desember 2025", status: "Tepat Waktu" },
  ];

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  // Error state jika session null setelah loading selesai
  if (!session) {
    return null;
  }

  // Ambil data user dari session
  const userName = session.user?.name || session.user?.email?.split('@')[0] || "User";
  const userEmail = session.user?.email || "email@domain.com";
  const userImage = session.user?.image || null;
  const userNim = String((session.user as any)?.nim || "202400000");
  const userJurusan = (session.user as any)?.jurusan || "Teknik Informatika";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="relative h-48 w-full overflow-hidden bg-white">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66 3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-45c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm26 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm16-34c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM24 7c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm34 35c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM92 80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM70 14c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM56 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-4 72c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM16 47c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm52 38c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm24-39c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM32 6c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm36 20c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-4-18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM42 55c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-26 23c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm24-32c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm44-17c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-38 1c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-6 40c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-12-67c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm31-16c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm24 33c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-6-8c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-18-12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-12 16c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-16 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm20 22c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm20-10c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-40 10c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM38 58c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM62 48c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM72 80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM48 80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm10-30c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM56 40c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-10-20c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm40 10c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-10-10c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm10 20c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-10-10c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%239b1c1c' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundColor: '#f8f8f8',
              backgroundSize: '300px'
            }}
          ></div>
        </div>

        {/* Profile Info Container */}
        <div className="max-w-6xl mx-auto px-4 relative -mt-24">
          <div className="flex flex-col md:flex-row items-end md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Foto Profil */}
            <div className="relative group">
              <div className="w-44 h-44 rounded-3xl bg-red-400 overflow-hidden shadow-xl border-4 border-white">
                {userImage ? (
                  <img 
                    src={userImage} 
                    alt={userName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-gradient-to-br from-red-400 to-red-600">
                    {userName.charAt(0).toUpperCase()}
                    {userName.split(' ')[1]?.charAt(0).toUpperCase() || ''}
                  </div>
                )}
              </div>
            </div>

            {/* Nama & Detail */}
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
                {userName}
              </h1>
              <p className="text-lg font-medium text-blue-400">{userJurusan}</p>
              <p className="text-sm text-gray-400 mt-1">{userEmail}</p>
              <p className="text-sm text-gray-500 mt-1">NIM: {userNim}</p>
            </div>
          </div>

          {/* Navigasi Tab */}
          <div className="flex flex-wrap gap-4 md:gap-8 border-b border-gray-100 mt-12 pb-0">
            {[
              { id: "peminjaman-aktif", label: "Peminjaman Aktif", count: activeLoans.length },
              { id: "riwayat-peminjaman", label: "Riwayat Peminjaman", count: loanHistory.length },
              { id: "reservasi", label: "Reservasi", count: 0 },
              { id: "tagihan-denda", label: "Tagihan & Denda", count: 0 },
              { id: "kartu-member", label: "Kartu Member", count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-1 py-4 text-sm font-semibold transition-all ${
                  activeTab === tab.id ? "text-red-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="absolute -top-1 -right-3 text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-red-700 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Content Section */}
          <div className="py-8">
            {activeTab === "riwayat-peminjaman" && (
              <RiwayatPeminjaman type="history" />
            )}

            {activeTab === "peminjaman-aktif" && (
              <RiwayatPeminjaman type="active" />
            )}

            {activeTab === "reservasi" && (
              <ReservationList 
                isOpen={true}
                onClose={() => setActiveTab("riwayat-peminjaman")}
                memberId={session.user?.id}
              />
            )}

            {activeTab === "tagihan-denda" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Tagihan</h3>
                <p className="text-gray-500 mb-6">Anda tidak memiliki tagihan atau denda saat ini</p>
                <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Lihat Riwayat Pembayaran
                </button>
              </div>
            )}

            {activeTab === "kartu-member" && (
              <MemberCard
                name={userName}
                nim={userNim}
                major={userJurusan}
                category="Mahasiswa"
                onPrint={() => {
                  alert(`Kartu anggota ${userName} sedang dicetak...`);
                }}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;