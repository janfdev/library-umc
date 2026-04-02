import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Calendar, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import reservationService, { type Reservation } from '@/services/reservationService';
import { useToast } from '@/hooks/useToast';



interface ReservationListProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string; // ID member yang login
}

const ReservationList = ({ isOpen, onClose, memberId }: ReservationListProps) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'fulfilled' | 'canceled'>('all');
  const toast = useToast();

  const fetchUserReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reservationService.getMyReservations();
      setReservations(data);
      
    } catch (error) {
      console.error('Error fetching reservations:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memuat daftar reservasi';
      setError(errMsg);
      toast.error('Gagal', errMsg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) return;

    try {
      const loadingId = toast.loading('Memproses', 'Membatalkan reservasi...');
      await reservationService.cancelReservation(reservationId);
      toast.removeToast(loadingId);
      toast.success('Berhasil', 'Reservasi telah dibatalkan');
      fetchUserReservations(); // Refresh list
    } catch (error) {
      toast.error('Gagal', error instanceof Error ? error.message : 'Terjadi kesalahan saat membatalkan reservasi');
    }
  };

  useEffect(() => {
    if (isOpen && memberId) {
      fetchUserReservations();
    }
  }, [isOpen, memberId, fetchUserReservations]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-600', 
        label: 'Menunggu Konfirmasi', 
        icon: Clock 
      },
      fulfilled: { 
        bg: 'bg-green-50', 
        text: 'text-green-600', 
        label: 'Disetujui', 
        icon: CheckCircle 
      },
      canceled: { 
        bg: 'bg-red-50', 
        text: 'text-red-600', 
        label: 'Dibatalkan', 
        icon: XCircle 
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      waiting: 'Menunggu Konfirmasi',
      fulfilled: 'Sedang Dipinjam',
      canceled: 'Dibatalkan'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'all') return true;
    return res.status === activeTab;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-[32px] w-full max-w-2xl shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Daftar Reservasi Saya</h2>
              <p className="text-sm text-slate-400 font-medium">Kelola peminjaman buku Anda</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-6 pb-0 border-b border-gray-100 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'waiting', label: 'Menunggu' },
              { id: 'fulfilled', label: 'Disetujui' },
              { id: 'canceled', label: 'Dibatalkan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'waiting' | 'fulfilled' | 'canceled')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-50 text-red-700'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader size={40} className="text-red-700 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Memuat reservasi...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle size={48} className="mx-auto text-red-300 mb-4" />
                <p className="text-red-600 font-medium mb-2">Gagal memuat data</p>
                <p className="text-sm text-slate-400 mb-4">{error}</p>
                <button
                  onClick={fetchUserReservations}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
                >
                  Coba Lagi
                </button>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">Belum ada reservasi</p>
                <p className="text-sm text-slate-300 mt-1">
                  {activeTab === 'all' 
                    ? 'Silakan pinjam buku dari katalog' 
                    : `Tidak ada reservasi dengan status ${activeTab}`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.map((res) => (
                  <div key={res.id} className="bg-slate-50 rounded-2xl p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex gap-4">
                      {/* Book Cover */}
                      <div className="w-16 h-20 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                        {res.collection?.image ? (
                          <img 
                            src={res.collection.image} 
                            alt={res.collection.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-white p-1 text-center">
                            <span className="text-[8px] font-bold">
                              {res.collection?.title || 'No Cover'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                              {res.collection?.title || 'Judul tidak tersedia'}
                            </h3>
                            <p className="text-xs text-slate-400 mb-2 truncate">
                              {res.collection?.author || 'Penulis tidak tersedia'}
                            </p>
                          </div>
                          {getStatusBadge(res.status)}
                        </div>

                        {/* Detail Info */}
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                            <Calendar size={12} />
                            <span>Reservasi: {formatDate(res.createdAt)}</span>
                          </div>
                          
                          {res.collection && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-white rounded-full text-[8px] font-medium text-slate-500">
                                {res.collection.type === 'physical_book' ? '📚 Buku Fisik' : '📱 E-Book'}
                              </span>
                              {res.collection.publisher && (
                                <span className="px-2 py-0.5 bg-white rounded-full text-[8px] font-medium text-slate-500">
                                  {res.collection.publisher}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[10px] text-slate-400">
                            Status: <span className="font-medium text-slate-600">
                              {getStatusText(res.status)}
                            </span>
                          </p>
                          
                          {res.status === 'waiting' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(res.id);
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 underline underline-offset-2"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
              <span>Total: {reservations.length} reservasi</span>
              <span>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationList;