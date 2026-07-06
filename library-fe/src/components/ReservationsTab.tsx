import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Info, Bookmark } from 'lucide-react';
import reservationService, { type Reservation } from '@/services/reservationService';

interface ReservationsTabProps {
  memberId: string;
}

const ReservationsTab = ({ memberId }: ReservationsTabProps) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const data = await reservationService.getMyReservations();
        setReservations(data);
      } catch (err) {
        console.error('Fetch reservations error:', err);
        const errMsg = err instanceof Error ? err.message : 'Gagal memuat reservasi';
        setError(errMsg);
        // Bisa toast kalau mau, tapi error view sudah cukup representatif
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchReservations();
    }
  }, [memberId]);

  if (loading) {
    return (
      <div className="py-12 text-center bg-card rounded-2xl border border-border shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground font-medium">Memuat data reservasi...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="py-10 text-center bg-accent rounded-2xl border border-primary p-6">
          <Info className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="text-primary font-bold text-lg mb-1">Gagal Memuat Data</h3>
          <p className="text-primary/80 text-sm">{error}</p>
        </div>
      );
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center group">
        <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6 group-hover:scale-110 transition-transform duration-500">
          <Bookmark className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-black text-foreground mb-2">Kosong</h3>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          Belum ada buku yang kamu reservasi. Cukup klik 'Reservasi' di katalog jika stok buku sedang kosong.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 animate-fade-in">
      {reservations.map((res) => (
        <ReservationCard key={res.id} reservation={res} />
      ))}
    </div>
  );
};

const ReservationCard = ({ reservation }: { reservation: Reservation }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting': return { label: 'Menunggu', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', icon: <Clock size={12} /> };
      case 'fulfilled': return { label: 'Tersedia', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', icon: <CheckCircle size={12} /> };
      case 'canceled': return { label: 'Dibatalkan', bg: 'bg-accent', text: 'text-primary', border: 'border-primary', icon: <XCircle size={12} /> };
      default: return { label: status, bg: 'bg-muted', text: 'text-foreground', border: 'border-border', icon: <Info size={12} /> };
    }
  };

  const status = getStatusInfo(reservation.status);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border flex flex-col md:flex-row items-center gap-5 hover:bg-muted/50 transition-all group shadow-sm shadow-slate-100/50">
      <div className="shrink-0 w-16 h-22 rounded-xl bg-slate-100 overflow-hidden shadow-sm group-hover:rotate-3 transition-transform duration-500">
        {reservation.bibliography?.image ? (
          <img src={reservation.bibliography.image} alt={reservation.bibliography.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary flex items-center justify-center text-white text-[8px] font-black p-2 text-center">
            {reservation.bibliography?.title}
          </div>
        )}
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h4 className="font-black text-foreground tracking-tight text-lg">{reservation.bibliography?.title || 'Buku Tidak Diketahui'}</h4>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.text} border ${status.border} mx-auto md:mx-0 shadow-sm shadow-slate-100`}>
                {status.icon}
                {status.label}
            </span>
        </div>
        <p className="text-xs text-muted-foreground font-bold mb-4 uppercase tracking-widest">PENULIS: <span className="text-primary">{reservation.bibliography?.author || 'ANONYMOUS'}</span></p>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-xl border border-border uppercase tracking-tighter">
                <Calendar size={12} className="text-primary" />
                Dibuat: {new Date(reservation.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-xl border border-border uppercase tracking-tighter">
                <Info size={12} className="text-primary" />
                ID: {reservation.id.split('-')[0].toUpperCase()}
            </div>
        </div>
      </div>

      <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
         <button className="flex-1 md:w-32 bg-foreground text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/90 transition-all active:scale-95 shadow-lg shadow-slate-200">DETAIL</button>
         {reservation.status === 'waiting' && <button className="flex-1 md:w-32 bg-accent text-primary py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all active:scale-95">BATALKAN</button>}
      </div>
    </div>
  );
};

export default ReservationsTab;
