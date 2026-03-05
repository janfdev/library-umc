// src/pages/KatalogDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { API_BASE_URL } from '../lib/api-config';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/Footer';
import ReservationList from '@/components/ReservationList';
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
  Clock
} from 'lucide-react';

// Interface untuk Collection (sesuai schema backend)
interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  isbn?: string;
  type: string;
  categoryId: number;  // Perhatikan: categoryId, bukan category_id
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    description?: string;
  };
}

// Interface untuk User
interface User {
  id: string;
  memberId?: string;  // ID di tabel Member
  name: string;
  email: string;
  role: 'admin' | 'mahasiswa';
  nim?: string;
}

// Interface untuk Reservation
interface Reservation {
  id: string;
  memberId: string;
  collectionId: string;
  status: 'waiting' | 'fulfilled' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

const KatalogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showReservationList, setShowReservationList] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Mock user - ganti dengan auth context yang sebenarnya
  const [currentUser] = useState<User>({
    id: 'user-123',
    memberId: 'member-456',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'mahasiswa',
    nim: '2021001'
  });

  // Mock data untuk "Buku Serupa"
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
        
        // 1. Fetch detail koleksi
        const collectionResponse = await fetch(`${API_BASE_URL}/api/collections/${id}`);
        if (!collectionResponse.ok) throw new Error(`HTTP error! status: ${collectionResponse.status}`);
        const collectionJson = await collectionResponse.json();
        
        if (collectionJson.success && collectionJson.data) {
          setCollection(collectionJson.data);
          
          // 2. Fetch semua reservasi aktif untuk buku ini (status fulfilled)
          const activeResResponse = await fetch(`${API_BASE_URL}/api/reservations?collectionId=${id}&status=fulfilled`);
          if (activeResResponse.ok) {
            const activeResJson = await activeResResponse.json();
            if (activeResJson.success && Array.isArray(activeResJson.data)) {
              setActiveReservations(activeResJson.data);
            }
          }
          
          // 3. Jika user login, fetch reservasi user untuk buku ini
          if (currentUser?.memberId) {
            const userResResponse = await fetch(`${API_BASE_URL}/api/reservations?memberId=${currentUser.memberId}&collectionId=${id}`);
            if (userResResponse.ok) {
              const userResJson = await userResResponse.json();
              if (userResJson.success && Array.isArray(userResJson.data)) {
                setUserReservations(userResJson.data);
              }
            }
          }
          
          // 4. Fetch similar books berdasarkan kategori yang sama
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

    if (id) fetchData();
    window.scrollTo(0, 0);
  }, [id, currentUser]);

  // Helper: Cek status buku
  const getBookStatus = (): 'available' | 'borrowed' | 'reserved' => {
    // Cek apakah ada reservasi aktif (fulfilled) untuk buku ini
    const isBorrowed = activeReservations.length > 0;
    
    if (isBorrowed) return 'borrowed';
    
    // Cek apakah user memiliki reservasi waiting
    const hasUserWaiting = userReservations.some(res => res.status === 'waiting');
    if (hasUserWaiting) return 'reserved';
    
    return 'available';
  };

  // Helper: Cek apakah user sudah meminjam buku ini
  const isUserBorrowing = (): boolean => {
    return userReservations.some(res => res.status === 'fulfilled');
  };

  // Helper: Cek apakah user sudah reservasi (waiting)
  const isUserWaiting = (): boolean => {
    return userReservations.some(res => res.status === 'waiting');
  };

  // Fungsi untuk meminjam buku
  const handleBorrow = async () => {
    // Cek apakah user sudah login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Cek apakah user sudah meminjam buku ini
    if (isUserBorrowing()) {
      showNotification('Anda sudah meminjam buku ini', 'error');
      return;
    }

    // Cek apakah user sudah waiting
    if (isUserWaiting()) {
      showNotification('Anda sudah melakukan reservasi untuk buku ini', 'error');
      return;
    }

    // Cek status buku
    const bookStatus = getBookStatus();
    if (bookStatus === 'borrowed') {
      showNotification('Buku sedang dipinjam orang lain', 'error');
      return;
    }

    setBorrowLoading(true);
    try {
      // Kirim request peminjaman (status: waiting)
      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: currentUser.memberId,
          collectionId: collection?.id,
          status: 'waiting' // Menunggu konfirmasi petugas
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('Permintaan peminjaman berhasil dikirim! Menunggu konfirmasi petugas.', 'success');
        
        // Update user reservations
        setUserReservations([...userReservations, data.data]);
      } else {
        throw new Error(data.message || 'Gagal melakukan peminjaman');
      }
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Terjadi kesalahan', 'error');
    } finally {
      setBorrowLoading(false);
    }
  };

  // Fungsi untuk cek daftar reservasi user (modal)
  const handleCheckReservations = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setShowReservationList(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const bookStatus = getBookStatus();
  const isBorrowing = isUserBorrowing();
  const isWaiting = isUserWaiting();

  if (loading) return (
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
          notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } flex items-center gap-3 animate-slide-down`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-red-600" />
          )}
          <p className={`text-sm font-medium ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

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
                { icon: <Share2 size={18} />, label: "Bagikan", onClick: () => {/* Implement share */} },
                { icon: <Bookmark size={18} />, label: "Simpan", onClick: () => {/* Implement bookmark */} },
                { icon: <QrCode size={18} />, label: "QR Code", onClick: () => {/* Implement QR */} }
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
            <div className="flex gap-2 mb-4">
              {/* Status Badge */}
              {isBorrowing ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-purple-50 text-purple-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Sedang Anda Pinjam
                </span>
              ) : isWaiting ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-yellow-50 text-yellow-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  Menunggu Konfirmasi
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
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{collection?.title}</h1>
            <p className="text-md text-slate-400 font-medium mb-8">Oleh <span className="text-red-600 font-bold">{collection?.author}</span></p>
            
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
              <p className="text-slate-600 leading-relaxed text-sm">{collection?.description || 'Deskripsi tidak tersedia.'}</p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 mt-auto">
              {/* Tombol PINJAM BUKU - untuk meminjam */}
              <button 
                onClick={handleBorrow}
                disabled={
                  borrowLoading || 
                  isBorrowing || 
                  isWaiting || 
                  bookStatus === 'borrowed'
                }
                className="flex-[2] bg-[#9a1b1b] hover:bg-[#7a1515] disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
              >
                {borrowLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Memproses...
                  </>
                ) : isBorrowing ? (
                  <>
                    <CheckCircle size={18} /> 
                    Sedang Anda Pinjam
                  </>
                ) : isWaiting ? (
                  <>
                    <Clock size={18} /> 
                    Menunggu Konfirmasi
                  </>
                ) : bookStatus === 'borrowed' ? (
                  <>
                    <Calendar size={18} /> 
                    Tidak Tersedia
                  </>
                ) : (
                  <>
                    <Bookmark size={18} /> 
                    Pinjam Buku
                  </>
                )}
              </button>
              
              {/* Tombol CEK RESERVASI - untuk melihat daftar reservasi user */}
              {currentUser && (
                <button 
                  onClick={handleCheckReservations}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
                >
                  <Bell size={18} /> 
                  Cek Reservasi Saya
                </button>
              )}
            </div>

            {/* Info untuk user yang belum login */}
            {!currentUser && (
              <p className="text-xs text-center text-slate-400 mt-4">
                Silakan <Link to="/login" className="text-red-700 font-bold">login</Link> untuk meminjam buku
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