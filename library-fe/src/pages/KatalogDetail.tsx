import { useParams, Link } from "react-router";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import ReservationList from "@/components/ReservationList";
import { authClient } from "@/utils/auth-client";
import { useKatalogDetail } from "@/hooks/useKatalogDetail";
import { useKatalogActions } from "@/hooks/useKatalogActions";
import type { LibraryUser } from "@/types";
import { PerspectiveBook } from "@/components/perspective-book";
import {
  Share2,
  Bookmark,
  QrCode,
  Calendar,
  ChevronRight,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { generateColorFromSeed } from "@/utils/format";

const KatalogDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const currentUser: LibraryUser | null = session?.user
    ? {
        id: session.user.id,
        memberId:
          (session.user as { memberId?: string }).memberId ?? session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role:
          (session.user as { role?: "admin" | "mahasiswa" }).role ??
          "mahasiswa",
        nim: (session.user as { nim?: string }).nim,
      }
    : null;

  const {
    collection,
    userLoans,
    pendingRequests,
    userReservation,
    loading,
    error,
    similarBooks,
    setUserReservation,
    setPendingRequests,
  } = useKatalogDetail(id, currentUser, sessionLoading);

  const {
    showReservationList,
    setShowReservationList,
    borrowLoading,
    showLoanForm,
    setShowLoanForm,
    loanFormData,
    setLoanFormData,
    getBookStatus,
    isUserBorrowing,
    isUserPending,
    isUserReserved,
    handleInputChange,
    handleBorrow,
    handleSubmitLoan,
    handleCheckLoans,
  } = useKatalogActions({
    collection,
    currentUser,
    userLoans,
    pendingRequests,
    userReservation,
    setUserReservation,
    setPendingRequests,
  });

  const bookStatus = getBookStatus();
  const isBorrowing = isUserBorrowing();
  const isPending = isUserPending();

  if (loading || sessionLoading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Modal Form Peminjaman */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Ajukan Peminjaman Buku
            </h3>

            <div className="space-y-4 mb-6">
              {/* Info Buku */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-900">
                  {collection?.title}
                </p>
                <p className="text-sm text-slate-600">{collection?.author}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Peminjaman
                </label>
                <input
                  type="date"
                  name="loanDate"
                  value={loanFormData.loanDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500/10"
                  required
                />
              </div>

              {/* ✅ Tanggal Pengembalian — otomatis 3 hari, diblokir dari input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Pengembalian (Maks 3 Hari)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={loanFormData.dueDate}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  name="notes"
                  value={loanFormData.notes}
                  onChange={handleInputChange}
                  placeholder="Contoh: untuk tugas akhir, dll"
                  className="w-full px-4 py-2.5 border border-slate-200 text-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-red-500/10"
                  rows={3}
                />
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl space-y-1">
                <p>• Maksimal peminjaman 14 hari</p>
                <p>• Denda keterlambatan Rp 2.000/hari</p>
                <p>• Permintaan akan diproses oleh petugas</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoanForm(false);
                  setLoanFormData({ loanDate: "", dueDate: "", notes: "" });
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-black text-sm font-medium hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitLoan}
                disabled={borrowLoading}
                className="flex-1 bg-[#9a1b1b] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#7a1515] disabled:bg-slate-400 transition-all"
              >
                {borrowLoading ? "Memproses..." : "Ajukan Peminjaman"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-gray-400 mb-6 font-medium">
          <Link to="/" className="hover:text-red-700">
            Beranda
          </Link>
          <ChevronRight size={12} />
          <Link to="/katalog" className="hover:text-red-700">
            Katalog
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-bold truncate">
            {collection?.title}
          </span>
        </nav>

        {/* Card Utama */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row mb-12">
          {/* Sisi Kiri - Visual */}
          <div className="md:w-[35%] bg-[#F8FAFC] p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
            <div className="w-52 h-72 rounded-xl overflow-hidden shadow-2xl bg-white mb-8">
              {collection?.image ? (
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-white p-4 text-center">
                  <span className="font-bold text-lg italic">
                    {collection?.title}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-5">
              {[
                {
                  icon: <Share2 size={18} />,
                  label: "Bagikan",
                  onClick: () => {},
                },
                {
                  icon: <Bookmark size={18} />,
                  label: "Simpan",
                  onClick: () => {},
                },
                {
                  icon: <QrCode size={18} />,
                  label: "QR Code",
                  onClick: () => {},
                },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="p-2.5 border border-gray-200 rounded-xl group-hover:bg-white group-hover:shadow-sm text-gray-400 group-hover:text-red-700 transition-all">
                    {btn.icon}
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sisi Kanan - Konten */}
          <div className="md:w-[65%] p-8 md:p-10 flex flex-col">
            <div className="flex gap-2 mb-4 flex-wrap">
              {/* Status Badge */}
              {isBorrowing ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-purple-50 text-purple-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Sedang Anda Pinjam
                </span>
              ) : isPending ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-yellow-50 text-yellow-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  Menunggu Persetujuan
                </span>
              ) : isUserReserved() ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-orange-50 text-orange-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Buku Sudah Anda Reservasi
                </span>
              ) : bookStatus === "empty" ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-red-50 text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Stok Kosong
                </span>
              ) : bookStatus === "available" ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-green-50 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Tersedia
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-blue-50 text-blue-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Sedang Dipinjam
                </span>
              )}

              <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold">
                {collection?.type === "physical_book" ? "Buku Fisik" : "E-Book"}
              </span>

              {collection?.items ? (
                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold">
                  Stok:{" "}
                  {
                    collection.items.filter((i) => i.status === "available")
                      .length
                  }{" "}
                  Fisik Tersedia
                </span>
              ) : collection?.stock !== undefined ? (
                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold">
                  Stok: {collection.stock}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
              {collection?.title}
            </h1>
            <p className="text-md text-slate-400 font-medium mb-8">
              Oleh{" "}
              <span className="text-red-600 font-bold">
                {collection?.author}
              </span>
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 border-b border-slate-50 pb-8">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  ISBN
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {collection?.isbn || "-"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Penerbit
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {collection?.publisher || "-"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Tahun
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {collection?.publicationYear || "-"}
                </p>
              </div>
            </div>

            <div className="mb-10 grow">
              <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-tight">
                Sinopsis
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {collection?.description || "Deskripsi tidak tersedia."}
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleBorrow}
                disabled={borrowLoading || isBorrowing}
                className="flex-2 bg-[#9a1b1b] hover:bg-[#7a1515] disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
              >
                {borrowLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Memproses...
                  </>
                ) : isBorrowing ? (
                  <>
                    <CheckCircle size={18} /> Sedang Anda Pinjam
                  </>
                ) : isPending ? (
                  <>
                    <Clock size={18} /> Menunggu Persetujuan
                  </>
                ) : isUserReserved() ? (
                  <>
                    <Calendar size={18} /> Sudah Reservasi
                  </>
                ) : bookStatus === "borrowed" || bookStatus === "empty" ? (
                  <>
                    <Calendar size={18} /> Reservasi Buku
                  </>
                ) : (
                  <>
                    <Bookmark size={18} /> Pinjam Buku
                  </>
                )}
              </button>

              {currentUser && (
                <button
                  onClick={handleCheckLoans}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
                >
                  <Bell size={18} />
                  Cek Status
                </button>
              )}
            </div>

            {!currentUser && (
              <p className="text-xs text-center text-slate-400 mt-4">
                Silakan{" "}
                <Link to="/login" className="text-red-700 font-bold">
                  login
                </Link>{" "}
                untuk meminjam buku
              </p>
            )}

            {isPending && (
              <p className="text-xs text-center text-yellow-600 mt-3 bg-yellow-50 p-2 rounded-xl">
                Permintaan peminjaman Anda sedang diproses oleh petugas.
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* SECTION: BUKU SERUPA */}
        <div className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Buku Serupa
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                Buku lain dengan topik yang mungkin Anda sukai
              </p>
            </div>
            <Link
              to="/katalog"
              className="text-red-700 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-6">
            {similarBooks.map((book) => (
              <Link
                key={book.id}
                to={`/katalog/${book.id}`}
                className="group flex flex-col items-center gap-2"
              >
                <PerspectiveBook
                  size="sm"
                  className={generateColorFromSeed(book.id)}
                >
                  <div className="flex flex-col h-full gap-1.5">
                    <p className="font-semibold capitalize leading-4 text-white text-xs line-clamp-3">
                      {book.title}
                    </p>
                    <div className="mt-auto flex flex-col gap-1">
                      <span className="text-white/70 text-[10px] leading-tight line-clamp-1">
                        {book.author}
                      </span>
                      <div className="flex items-center gap-1">
                        <BookOpen className="size-3 text-white/70" />
                        <span className="text-white/60 text-[9px]">
                          {book.publicationYear ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </PerspectiveBook>
                <div className="text-center w-[150px]">
                  <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-red-700 transition-colors">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {book.author}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Daftar Reservasi User */}
      {currentUser && (
        <ReservationList
          isOpen={showReservationList}
          onClose={() => setShowReservationList(false)}
          memberId={currentUser.memberId}
        />
      )}

      <Footer />
    </div>
  );
};

export default KatalogDetail;
