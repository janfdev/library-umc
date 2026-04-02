import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { API_BASE_URL } from '@/utils/api-config';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/Footer';
import ReservationList from '@/components/ReservationList';
import LoanRequestForm from '@/components/LoanRequestForm';
import loanService from '@/services/loanService';
import { authClient } from '@/utils/auth-client';
import { 
  Share2, 
  Bookmark, 
  QrCode,  
  Calendar, 
  ChevronRight,
  ArrowRight,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

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
  stock?: number;
}

// ✅ Interface User
interface User {
  id: string;
  memberId?: string;
  name: string;
  email: string;
  role: 'admin' | 'mahasiswa';
  nim?: string;
}

// ✅ Interface Loan sesuai schema backend
interface LoanRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'returned' | 'overdue';
  itemId: string;
  memberId: string;
  loanDate?: string;
  dueDate?: string;
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
        memberId: (session.user as { memberId?: string }).memberId ?? session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: ((session.user as { role?: 'admin' | 'mahasiswa' }).role) ?? 'mahasiswa',
        nim: (session.user as { nim?: string }).nim,
      }
    : null;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [activeLoans, setActiveLoans] = useState<LoanRequest[]>([]);
  const [userLoans, setUserLoans] = useState<LoanRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LoanRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showReservationList, setShowReservationList] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [similarBooks, setSimilarBooks] = useState([
    { id: '1', title: 'Bulan', author: 'Tere Liye', image: null, color: 'bg-slate-800' },
    { id: '2', title: 'Matahari', author: 'Tere Liye', image: null, color: 'bg-red-900' },
    { id: '3', title: 'Bintang', author: 'Tere Liye', image: null, color: 'bg-indigo-900' },
    { id: '4', title: 'Ceros dan Batozar', author: 'Tere Liye', image: null, color: 'bg-purple-900' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch detail koleksi/item
        const collectionResponse = await fetch(`${API_BASE_URL}/api/collections/${id}`);
        if (!collectionResponse.ok) throw new Error(`HTTP error! status: ${collectionResponse.status}`);
        const collectionJson = await collectionResponse.json();

        if (collectionJson.success && collectionJson.data) {
          setCollection(collectionJson.data);

          // 2. Fetch active loans untuk item ini
          const activeLoansResponse = await fetch(
            `${API_BASE_URL}/api/loans?itemId=${id}&status=active`
          );
          if (activeLoansResponse.ok) {
            const activeLoansJson = await activeLoansResponse.json();
            if (activeLoansJson.success && Array.isArray(activeLoansJson.data)) {
              setActiveLoans(activeLoansJson.data);
            }
          }

          // 3. Jika user login, fetch loans user untuk item ini
          const memberId = currentUser?.memberId;
          if (memberId) {
            // Fetch pending requests user untuk item ini
            const pendingResponse = await fetch(
              `${API_BASE_URL}/api/loans?memberId=${memberId}&itemId=${id}&status=pending`
            );
            if (pendingResponse.ok) {
              const pendingJson = await pendingResponse.json();
              if (pendingJson.success && Array.isArray(pendingJson.data)) {
                setPendingRequests(pendingJson.data);
              }
            }

            // Fetch active loans user untuk item ini
            const userLoansResponse = await fetch(
              `${API_BASE_URL}/api/loans?memberId=${memberId}&itemId=${id}&status=active`
            );
            if (userLoansResponse.ok) {
              const userLoansJson = await userLoansResponse.json();
              if (userLoansJson.success && Array.isArray(userLoansJson.data)) {
                setUserLoans(userLoansJson.data);
              }
            }
          }

          // 4. Fetch similar books
          if (collectionJson.data.categoryId) {
            fetchSimilarBooks(collectionJson.data.categoryId);
          }
        } else {
          throw new Error(collectionJson.message || 'Data tidak ditemukan');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat detail buku');
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarBooks = async (categoryId: number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/collections?categoryId=${categoryId}&limit=4`);
        const data = await response.json();
        if (data.success) {
          setSimilarBooks(data.data);
        }
      } catch (error) {
        console.error('Error fetching similar books:', error);
      }
    };

    // ✅ Tunggu session selesai sebelum fetch
    if (id && !sessionLoading) fetchData();
    window.scrollTo(0, 0);
  }, [id, sessionLoading, currentUser?.memberId]);

  // Helper: Cek status buku
  const getBookStatus = (): 'available' | 'borrowed' | 'reserved' => {
    if (activeLoans.length > 0) return 'borrowed';
    if (pendingRequests.length > 0) return 'reserved';
    return 'available';
  };

  const isUserBorrowing = (): boolean => userLoans.length > 0;
  const isUserPending = (): boolean => pendingRequests.length > 0;

  // Handle klik tombol pinjam
  const handleBorrow = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (isUserBorrowing()) {
      showNotification('Anda sedang meminjam buku ini', 'error');
      return;
    }
    if (isUserPending()) {
      showNotification('Anda sudah mengajukan peminjaman untuk buku ini', 'error');
      return;
    }
    if (getBookStatus() === 'borrowed') {
      if (confirm('Buku sedang dipinjam orang lain. Ingin masuk antrian reservasi?')) {
        navigate(`/reservasi/${id}`);
      }
      return;
    }
    setShowLoanForm(true);
  };

  // Submit form peminjaman
  const handleSubmitLoan = async (formData: { loanDate: string; dueDate: string; notes: string }) => {
    // ✅ Validasi lengkap sebelum kirim request
    if (!currentUser) {
      showNotification('Anda harus login terlebih dahulu', 'error');
      navigate('/login');
      return;
    }

    if (!currentUser.memberId) {
      showNotification('ID member tidak ditemukan. Silakan login ulang.', 'error');
      return;
    }

    if (!collection?.id) {
      showNotification('Data buku tidak ditemukan', 'error');
      return;
    }

    setBorrowLoading(true);
    try {
      // ✅ Kirim dengan field sesuai schema backend
      const loan = await loanService.requestLoan({
        memberId: currentUser.memberId,
        itemId: collection.id,
        loanDate: formData.loanDate,
        dueDate: formData.dueDate,
        notes: formData.notes
      });

      showNotification('Permintaan peminjaman berhasil dikirim! Menunggu persetujuan petugas.', 'success');
      setPendingRequests([...pendingRequests, loan as unknown as LoanRequest]);
      setShowLoanForm(false);

    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Terjadi kesalahan saat mengajukan peminjaman',
        'error'
      );
      throw error; // Re-throw agar form component bisa menangani error
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleCheckLoans = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/loans/history');
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const bookStatus = getBookStatus();
  const isBorrowing = isUserBorrowing();
  const isPending = isUserPending();

  // ✅ Loading saat session atau data sedang dimuat
  if (loading || sessionLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        } flex items-center gap-3 animate-slide-down`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : notification.type === 'error' ? (
            <XCircle size={20} className="text-red-600" />
          ) : (
            <AlertCircle size={20} className="text-blue-600" />
          )}
          <p className={`text-sm font-medium ${
            notification.type === 'success' ? 'text-green-800' :
            notification.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

      {/* Loan Request Form Component */}
      <LoanRequestForm
        isOpen={showLoanForm}
        collectionTitle={collection?.title || ''}
        collectionAuthor={collection?.author || ''}
        onSubmit={handleSubmitLoan}
        onClose={() => setShowLoanForm(false)}
        isLoading={borrowLoading}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-gray-400 mb-6 font-medium">
          <Link to="/" className="hover:text-red-700">Beranda</Link>
          <ChevronRight size={12} />
          <Link to="/katalog" className="hover:text-red-700">Katalog</Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-bold truncate">{collection?.title}</span>
        </nav>

        {/* Card Utama */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row mb-12">
          {/* Sisi Kiri - Visual */}
          <div className="md:w-[35%] bg-[#F8FAFC] p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
            <div className="w-52 h-72 rounded-xl overflow-hidden shadow-2xl bg-white mb-8">
              {collection?.image ? (
                <img src={collection.image} alt={collection.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-white p-4 text-center">
                  <span className="font-bold text-lg italic">{collection?.title}</span>
                </div>
              )}
            </div>
            <div className="flex gap-5">
              {[
                { icon: <Share2 size={18} />, label: 'Bagikan', onClick: () => {} },
                { icon: <Bookmark size={18} />, label: 'Simpan', onClick: () => {} },
                { icon: <QrCode size={18} />, label: 'QR Code', onClick: () => {} }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="p-2.5 border border-gray-200 rounded-xl group-hover:bg-white group-hover:shadow-sm text-gray-400 group-hover:text-red-700 transition-all">
                    {btn.icon}
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{btn.label}</span>
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
              ) : bookStatus === 'available' ? (
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
                {collection?.type === 'physical_book' ? 'Buku Fisik' : 'E-Book'}
              </span>

              {collection?.stock !== undefined && (
                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold">
                  Stok: {collection.stock - activeLoans.length}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
              {collection?.title}
            </h1>
            <p className="text-md text-slate-400 font-medium mb-8">
              Oleh <span className="text-red-600 font-bold">{collection?.author}</span>
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 border-b border-slate-50 pb-8">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ISBN</p>
                <p className="text-xs font-bold text-slate-700">{collection?.isbn || '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penerbit</p>
                <p className="text-xs font-bold text-slate-700">{collection?.publisher || '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tahun</p>
                <p className="text-xs font-bold text-slate-700">{collection?.publicationYear || '-'}</p>
              </div>
            </div>

            <div className="mb-10 flex-grow">
              <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-tight">Sinopsis</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {collection?.description || 'Deskripsi tidak tersedia.'}
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleBorrow}
                disabled={borrowLoading || isBorrowing}
                className="flex-[2] bg-[#9a1b1b] hover:bg-[#7a1515] disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
              >
                {borrowLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Memproses...
                  </>
                ) : isBorrowing ? (
                  <><CheckCircle size={18} /> Sedang Anda Pinjam</>
                ) : isPending ? (
                  <><Clock size={18} /> Menunggu Persetujuan</>
                ) : bookStatus === 'borrowed' ? (
                  <><Calendar size={18} /> Reservasi Buku</>
                ) : (
                  <><Bookmark size={18} /> Pinjam Buku</>
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
                Silakan <Link to="/login" className="text-red-700 font-bold">login</Link> untuk meminjam buku
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
              <h2 className="text-xl font-extrabold text-slate-900">Buku Serupa</h2>
              <p className="text-sm text-slate-400 font-medium">Buku lain dengan topik yang mungkin Anda sukai</p>
            </div>
            <Link to="/katalog" className="text-red-700 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
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
                <div className={`aspect-[3/4] rounded-2xl ${book.color} mb-4 overflow-hidden shadow-md group-hover:shadow-lg transition-all`}>
                  {book.image ? (
                    <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
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
                <p className="text-xs text-slate-400 font-medium">{book.author}</p>
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