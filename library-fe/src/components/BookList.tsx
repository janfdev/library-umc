// src/components/BookList.tsx
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../lib/api-config';

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
}

interface Reservation {
  id: string;
  memberId: string;
  collectionId: string;
  status: 'waiting' | 'fulfilled' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  memberId?: string;
  name: string;
  email: string;
  role: 'admin' | 'mahasiswa';
  nim?: string;
}

interface BookListProps {
  searchQuery?: string;
  searchType?: string;
  availabilityFilter?: string[];
  yearRange?: { start: string; end: string };
  currentUser?: User | null;
}

const BookList = ({
  searchQuery = "",
  searchType = "all",
  availabilityFilter = [],
  yearRange = { start: "", end: "" },
  currentUser = null
}: BookListProps) => {
  const navigate = useNavigate();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch semua koleksi buku
        const collectionsResponse = await fetch(`${API_BASE_URL}/api/collections`);
        
        if (!collectionsResponse.ok) {
          throw new Error(`HTTP error! status: ${collectionsResponse.status}`);
        }

        const collectionsJson = await collectionsResponse.json();

        if (collectionsJson.success && Array.isArray(collectionsJson.data)) {
          setCollections(collectionsJson.data);
          console.log('Data collections:', collectionsJson.data);
        } else {
          throw new Error('Invalid API response structure');
        }

        // 2. Fetch semua reservasi aktif (fulfilled) untuk mengetahui status buku
        const reservationsResponse = await fetch(`${API_BASE_URL}/api/reservations?status=fulfilled`);
        if (reservationsResponse.ok) {
          const reservationsJson = await reservationsResponse.json();
          if (reservationsJson.success && Array.isArray(reservationsJson.data)) {
            setAllReservations(reservationsJson.data);
            console.log('Reservasi aktif:', reservationsJson.data);
          }
        }

        // 3. Jika user login, fetch reservasi user
        if (currentUser?.memberId) {
          await fetchUserReservations(currentUser.memberId);
        }

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserReservations = async (memberId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reservations?memberId=${memberId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setUserReservations(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching user reservations:', error);
      }
    };

    fetchData();
  }, [currentUser]);

  // Helper: Cek apakah buku sedang dipinjam (oleh siapapun)
  const isBookBorrowed = (collectionId: string): boolean => {
    return allReservations.some(res => 
      res.collectionId === collectionId && res.status === 'fulfilled'
    );
  };

  // Helper: Cek apakah user sedang meminjam buku ini
  const isUserBorrowing = (collectionId: string): boolean => {
    return userReservations.some(res => 
      res.collectionId === collectionId && 
      (res.status === 'fulfilled' || res.status === 'waiting')
    );
  };

  // Helper: Dapatkan status buku untuk keperluan filter
  const getBookStatus = (collectionId: string): string => {
    if (isBookBorrowed(collectionId)) {
      return 'borrowed';
    }
    return 'available';
  };

  // Filter berdasarkan tab
  const filteredByTab = collections.filter(collection => {
    if (activeTab === 0) {
      return collection.type === 'physical_book';
    } else {
      return collection.type === 'ebook';
    }
  });

  // Filter berdasarkan search query
  const filteredBySearch = filteredByTab.filter(collection => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    switch (searchType) {
      case 'title':
        return collection.title.toLowerCase().includes(query);
      case 'author':
        return collection.author.toLowerCase().includes(query);
      case 'isbn':
        return collection.isbn?.toLowerCase().includes(query);
      case 'all':
      default:
        return (
          collection.title.toLowerCase().includes(query) ||
          collection.author.toLowerCase().includes(query) ||
          collection.isbn?.toLowerCase().includes(query) ||
          collection.publisher.toLowerCase().includes(query)
        );
    }
  });

  // Filter berdasarkan ketersediaan (dari filter sidebar)
  const filteredByAvailability = availabilityFilter.length > 0
    ? filteredBySearch.filter(collection => {
        const bookStatus = getBookStatus(collection.id);
        return availabilityFilter.includes(bookStatus);
      })
    : filteredBySearch;

  // Filter berdasarkan tahun terbit
  const filteredByYear = filteredByAvailability.filter(collection => {
    if (!yearRange.start && !yearRange.end) return true;

    const year = collection.publicationYear;
    const start = yearRange.start ? parseInt(yearRange.start) : 0;
    const end = yearRange.end ? parseInt(yearRange.end) : 9999;

    return year >= start && year <= end;
  });

  // Helper: Status label
  const getStatusLabel = (collection: Collection) => {
    // Cek apakah user sedang meminjam buku ini
    if (currentUser && isUserBorrowing(collection.id)) {
      const reservation = userReservations.find(r => r.collectionId === collection.id);
      if (reservation?.status === 'waiting') {
        return 'Menunggu Konfirmasi';
      } else if (reservation?.status === 'fulfilled') {
        return 'Sedang Anda Pinjam';
      }
    }
    
    // Status buku umum
    return isBookBorrowed(collection.id) ? 'Dipinjam' : 'Tersedia';
  };

  // Helper: Status badge style
  const getStatusBadge = (collection: Collection) => {
    // Jika user sedang meminjam/menunggu buku ini
    if (currentUser && isUserBorrowing(collection.id)) {
      const reservation = userReservations.find(r => r.collectionId === collection.id);
      if (reservation?.status === 'waiting') {
        return "px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium";
      } else if (reservation?.status === 'fulfilled') {
        return "px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium";
      }
    }
    
    // Status buku umum
    return isBookBorrowed(collection.id)
      ? "px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium"
      : "px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium";
  };

  // Helper: Cover color fallback
  const getCoverColor = (type: string) => {
    return type === 'physical_book' ? 'bg-purple-500' : 'bg-blue-500';
  };

  // Navigasi ke detail
  const handleBookClick = (collectionId: string) => {
    navigate(`/katalog/${collectionId}`);
  };

  if (loading) {
    return (
      <div className="w-[800px] bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data koleksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[800px] bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[800px] bg-white rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Koleksi Perpustakaan</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredByYear.length} hasil ditemukan
          </p>
          {currentUser && (
            <p className="text-xs text-purple-600 mt-1">
              Anda sedang meminjam {userReservations.filter(r => r.status === 'fulfilled').length} buku
              {userReservations.some(r => r.status === 'waiting') && 
                `, ${userReservations.filter(r => r.status === 'waiting').length} menunggu konfirmasi`
              }
            </p>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="hidden md:flex border-b border-gray-200">
          {["Buku Fisik", "E-Book"].map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === index
                  ? "text-red-700 border-b-2 border-red-700"
                  : "text-gray-700 hover:text-red-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-b border-gray-200 mb-6">
        {["Buku Fisik", "E-Book"].map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === index
                ? "text-red-700 border-b-2 border-red-700"
                : "text-gray-700 hover:text-red-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Book List */}
      <div className="space-y-4">
        {filteredByYear.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg font-semibold mb-2">Tidak ada hasil ditemukan</p>
            <p className="text-sm">
              Coba ubah kata kunci pencarian atau filter lainnya
            </p>
          </div>
        ) : (
          filteredByYear.map((collection) => (
            <div
              key={collection.id}
              onClick={() => handleBookClick(collection.id)}
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-white hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-200 hover:border-red-200"
            >
              {/* Cover Image */}
              <div className="w-16 h-24 rounded-lg mr-4 flex-shrink-0 overflow-hidden">
                {collection.image ? (
                  <img 
                    src={collection.image} 
                    alt={collection.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const div = document.createElement('div');
                        div.className = `${getCoverColor(collection.type)} w-full h-full flex items-center justify-center`;
                        div.innerHTML = `<span class="text-white text-xs font-medium">${collection.type === 'ebook' ? 'E-Book' : 'Buku'}</span>`;
                        parent.appendChild(div);
                      }
                    }}
                  />
                ) : (
                  <div className={`w-full h-full ${getCoverColor(collection.type)} flex items-center justify-center`}>
                    <span className="text-white text-xs font-medium">
                      {collection.type === 'ebook' ? 'E-Book' : 'Buku'}
                    </span>
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {collection.title}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {collection.author}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded">
                    {collection.type === 'physical_book' ? 'Buku Fisik' : 'E-Book'}
                  </span>
                  {collection.publicationYear && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded">
                      {collection.publicationYear}
                    </span>
                  )}
                  {collection.isbn && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded">
                      ISBN: {collection.isbn}
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="ml-4 flex-shrink-0">
                <span className={getStatusBadge(collection)}>
                  {getStatusLabel(collection)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keterangan status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Tersedia</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Dipinjam (orang lain)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>Sedang Anda pinjam</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Menunggu konfirmasi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookList;