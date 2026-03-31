import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { API_BASE_URL } from "@/utils/api-config";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/Footer";
import ReservationList from "@/components/ReservationList";
import loanService from "@/services/loanService";
import reservationService, {
  type Reservation,
} from "@/services/reservationService";
import { authClient } from "@/utils/auth-client";
import { useToast } from "@/hooks/useToast";
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
} from "lucide-react";

// ✅ Interface Collection (item di schema backend)
interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  isbn?: string;
  type: string;
  categoryId: number;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    description?: string;
  };
  items?: {
    id: string;
    status: string;
  }[];
  stock?: number;
}

// ✅ Interface User
interface User {
  id: string;
  memberId?: string;
  name: string;
  email: string;
  role: "admin" | "mahasiswa";
  nim?: string;
}

// ✅ Interface Loan sesuai schema backend
// Field: id, memberId, itemId, loanDate, dueDate, returnDate, status, approvedBy, createdAt, updatedAt
interface LoanRequest {
  id: string;
  status:
    | "pending"
    | "approved"
    | "extended"
    | "rejected"
    | "active"
    | "returned"
    | "overdue";
  itemId: string; // ✅ bukan collectionId
  memberId: string;
  loanDate?: string; // ✅ bukan startDate
  dueDate?: string; // ✅ bukan endDate
  returnDate?: string;
  approvedBy?: string;
  createdAt?: string;
  member?: Record<string, unknown>;
  item?: Record<string, unknown>;
}

const KatalogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ✅ Ambil session dari authClient
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  // ✅ Bangun currentUser dari session nyata
  const currentUser: User | null = session?.user
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

  const toast = useToast();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [userLoans, setUserLoans] = useState<LoanRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LoanRequest[]>([]);
  const [userReservation, setUserReservation] = useState<Reservation | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showReservationList, setShowReservationList] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);

  // Form field disesuaikan dengan schema: loanDate & dueDate
  const defaultLoanDate = new Date().toISOString().split("T")[0];
  const defaultDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [loanFormData, setLoanFormData] = useState({
    loanDate: defaultLoanDate,
    dueDate: defaultDueDate,
    notes: "",
  });

  const [similarBooks, setSimilarBooks] = useState([
    {
      id: "1",
      title: "Bulan",
      author: "Tere Liye",
      image: null,
      color: "bg-slate-800",
    },
    {
      id: "2",
      title: "Matahari",
      author: "Tere Liye",
      image: null,
      color: "bg-red-900",
    },
    {
      id: "3",
      title: "Bintang",
      author: "Tere Liye",
      image: null,
      color: "bg-indigo-900",
    },
    {
      id: "4",
      title: "Ceros dan Batozar",
      author: "Tere Liye",
      image: null,
      color: "bg-purple-900",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch detail koleksi/item
        const collectionResponse = await fetch(
          `${API_BASE_URL}/api/collections/${id}`,
        );
        if (!collectionResponse.ok)
          throw new Error(`HTTP error! status: ${collectionResponse.status}`);
        const collectionJson = await collectionResponse.json();

        if (collectionJson.success && collectionJson.data) {
          setCollection(collectionJson.data);

          // 2. Jika user login, ambil histori pinjaman user (endpoint member)
          const memberId = currentUser?.memberId;
          if (memberId) {
            try {
              const myLoans = await loanService.getMyLoanHistory();
              const loansForCollection = myLoans.filter(
                (loan: any) => loan?.item?.collection?.id === id,
              ) as LoanRequest[];

              setPendingRequests(
                loansForCollection.filter((loan) => loan.status === "pending"),
              );

              setUserLoans(
                loansForCollection.filter(
                  (loan) =>
                    loan.status === "approved" || loan.status === "extended",
                ),
              );
            } catch (err) {
              console.error("Error fetching member loans:", err);
              setPendingRequests([]);
              setUserLoans([]);
            }

            // Fetch user reservation untuk koleksi ini
            try {
              const reservations = await reservationService.getMyReservations();
              const activeRes = reservations.find(
                (r) => r.collectionId === id && r.status === "waiting",
              );
              setUserReservation(activeRes || null);
            } catch (err) {
              console.error("Error fetching reservation:", err);
            }
          }

          // 3. Fetch similar books
          if (collectionJson.data.categoryId) {
            fetchSimilarBooks(collectionJson.data.categoryId);
          }
        } else {
          throw new Error(collectionJson.message || "Data tidak ditemukan");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail buku",
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarBooks = async (categoryId: number) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/collections?categoryId=${categoryId}&limit=4`,
        );
        const data = await response.json();
        if (data.success) {
          setSimilarBooks(data.data);
        }
      } catch (error) {
        console.error("Error fetching similar books:", error);
      }
    };

    // ✅ Tunggu session selesai sebelum fetch
    if (id && !sessionLoading) fetchData();
    window.scrollTo(0, 0);
  }, [id, sessionLoading, currentUser?.memberId]);

  // Helper: Cek status buku
  const getBookStatus = (): "available" | "borrowed" | "reserved" | "empty" => {
    // Prioritas 1: gunakan item fisik jika memang ada datanya
    if (collection?.items && collection.items.length > 0) {
      const availableItems = collection.items.filter(
        (i) => i.status === "available",
      );
      return availableItems.length > 0 ? "available" : "empty";
    }

    // Prioritas 2: fallback ke stock agregat jika item fisik belum disediakan
    if (typeof collection?.stock === "number") {
      return collection.stock > 0 ? "available" : "empty";
    }

    return "available";
  };

  const isUserBorrowing = (): boolean => userLoans.length > 0;
  const isUserPending = (): boolean => pendingRequests.length > 0;
  const isUserReserved = (): boolean => !!userReservation;

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "loanDate") {
      const selectedDate = new Date(value);
      // Hitung 3 hari ke depan secara otomatis
      const calculatedDueDate = new Date(
        selectedDate.getTime() + 3 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0];
      setLoanFormData({
        ...loanFormData,
        loanDate: value,
        dueDate: calculatedDueDate,
      });
    } else {
      setLoanFormData({ ...loanFormData, [name]: value });
    }
  };

  // Handle klik tombol pinjam
  const handleBorrow = () => {
    if (!currentUser) {
      toast.warning("Auth", "Silakan login terlebih dahulu untuk meminjam");
      return;
    }
    if (isUserBorrowing()) {
      toast.warning("Info Pinjaman", "Anda sedang meminjam buku ini");
      return;
    }
    if (isUserPending()) {
      toast.warning(
        "Info Pinjaman",
        "Anda sudah mengajukan peminjaman untuk buku ini",
      );
      return;
    }
    if (getBookStatus() === "empty" || getBookStatus() === "borrowed") {
      if (
        confirm("Buku sedang tidak tersedia. Ingin masuk antrian reservasi?")
      ) {
        handleReserve();
      }
      return;
    }
    setShowLoanForm(true);
  };

  const handleReserve = async () => {
    if (!currentUser || !collection?.id) return;

    setBorrowLoading(true);
    const collectionId = collection.id;
    const loadingId = toast.loading(
      "Memproses",
      "Mendaftarkan ke antrian reservasi...",
    );
    try {
      await reservationService.createReservation(collectionId);
      toast.removeToast(loadingId);
      toast.success(
        "Berhasil",
        "Anda telah masuk dalam antrian reservasi. Kami akan memberitahu Anda via email jika buku sudah tersedia.",
      );
      setShowReservationList(true);

      // Update local status
      setUserReservation({
        id: "new", // Temporary ID
        memberId: currentUser.memberId || "",
        collectionId: collectionId,
        status: "waiting",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      toast.removeToast(loadingId);
      toast.error(
        "Gagal",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat reservasi",
      );
    } finally {
      setBorrowLoading(false);
    }
  };

  // Submit form peminjaman
  const handleSubmitLoan = async () => {
    // ✅ Validasi lengkap sebelum kirim request
    if (!currentUser) {
      toast.error("Auth", "Anda harus login terlebih dahulu");
      navigate("/login");
      return;
    }

    if (!currentUser.memberId) {
      toast.error(
        "Akses Ditolak",
        "ID member tidak ditemukan. Silakan login ulang.",
      );
      return;
    }

    if (!collection?.id) {
      toast.error("Error", "Data buku tidak ditemukan");
      return;
    }

    if (!loanFormData.loanDate || !loanFormData.dueDate) {
      toast.warning(
        "Form Belum Lengkap",
        "Pilih tanggal peminjaman dan pengembalian",
      );
      return;
    }

    // Validasi tanggal
    const start = new Date(loanFormData.loanDate);
    const end = new Date(loanFormData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast.warning(
        "Tanggal Tidak Valid",
        "Tanggal peminjaman tidak boleh kurang dari hari ini",
      );
      return;
    }

    if (end <= start) {
      toast.warning(
        "Tanggal Tidak Valid",
        "Tanggal pengembalian harus setelah tanggal peminjaman",
      );
      return;
    }

    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
    );
    if (diffDays > 14) {
      toast.warning("Melewati Batas", "Maksimal peminjaman 14 hari");
      return;
    }

    setBorrowLoading(true);
    const loadingId = toast.loading("Memproses", "Mengajukan peminjaman...");
    try {
      // ✅ Kirim dengan field sesuai schema backend
      const loan = await loanService.requestLoan({
        memberId: currentUser.memberId, // ✅ ID dari session nyata
        collectionId: collection.id, // ✅ gunakan collectionId, bukan itemId spesifik
        loanDate: loanFormData.loanDate,
        dueDate: loanFormData.dueDate,
        notes: loanFormData.notes,
      });

      toast.removeToast(loadingId);
      toast.success(
        "Berhasil",
        "Permintaan peminjaman berhasil dikirim! Menunggu persetujuan petugas.",
      );

      setPendingRequests((prev) => [...prev, loan as unknown as LoanRequest]);
      setShowLoanForm(false);

      // Reset form dates
      setLoanFormData({
        loanDate: defaultLoanDate,
        dueDate: defaultDueDate,
        notes: "",
      });
    } catch (error) {
      toast.removeToast(loadingId);
      toast.error(
        "Gagal",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengajukan peminjaman",
      );
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleCheckLoans = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate("/my-loans");
  };

  const bookStatus = getBookStatus();
  const isBorrowing = isUserBorrowing();
  const isPending = isUserPending();

  // ✅ Loading saat session atau data sedang dimuat
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

              {/* ✅ Tanggal Peminjaman — field: loanDate */}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarBooks.map((book) => (
              <Link
                key={book.id}
                to={`/katalog/${book.id}`}
                className="group bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div
                  className={`aspect-3/4 rounded-2xl ${book.color} mb-4 overflow-hidden shadow-md group-hover:shadow-lg transition-all`}
                >
                  {book.image ? (
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center">
                      <span className="text-white font-bold text-xs uppercase opacity-80 leading-tight">
                        {book.title}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 truncate group-hover:text-red-700 transition-colors">
                  {book.title}
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {book.author}
                </p>
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
