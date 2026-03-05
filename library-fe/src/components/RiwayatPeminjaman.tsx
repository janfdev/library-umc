import { useEffect, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react'; // ✅ Hapus Clock (tidak digunakan)
import { API_BASE_URL } from '@/lib/api-config';

interface Loan {
  id: string;
  collection_id: string;
  book_title: string;
  loan_date: string;
  due_date: string;
  return_date?: string;
  status: 'active' | 'returned' | 'overdue';
  fine_amount?: number;
}

interface RiwayatPeminjamanProps {
  type: 'active' | 'history'; // 'active' untuk peminjaman aktif, 'history' untuk riwayat
}

const RiwayatPeminjaman = ({ type }: RiwayatPeminjamanProps) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Anda harus login untuk melihat riwayat peminjaman');
          setLoading(false);
          return;
        }

        const endpoint = type === 'active' 
          ? '/api/borrow/active' 
          : '/api/borrow/history';
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setLoans(data.data);
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (err) {
        console.error('Fetch loans error:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data peminjaman');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [type]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Memuat data peminjaman...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center bg-red-50 rounded-lg p-4">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-5xl mb-4 text-gray-300">📚</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {type === 'active' 
            ? 'Tidak ada peminjaman aktif' 
            : 'Belum ada riwayat peminjaman'}
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {type === 'active'
            ? 'Anda belum meminjam buku apapun saat ini.'
            : 'Riwayat peminjaman Anda akan muncul di sini setelah Anda meminjam buku.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-red-800 text-white uppercase text-xs font-bold tracking-wider">
            <th className="px-6 py-4 text-left border-r border-red-700/30">Buku</th>
            <th className="px-6 py-4 text-left border-r border-red-700/30">Tanggal Pinjam</th>
            <th className="px-6 py-4 text-left border-r border-red-700/30">Batas Kembali</th>
            <th className="px-6 py-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
          {loans.map((loan) => (
            <tr 
              key={loan.id} 
              className={`hover:bg-gray-50/50 transition-colors ${
                loan.status === 'overdue' ? 'bg-red-50/50' : ''
              }`}
            >
              <td className="px-6 py-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold mr-3">
                    {loan.book_title.charAt(0)}
                  </div>
                  <span>{loan.book_title}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(loan.loan_date).toLocaleDateString('id-ID')}
                </div>
              </td>
              <td className="px-6 py-5 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(loan.due_date).toLocaleDateString('id-ID')}
                  {loan.status === 'overdue' && (
                    <span className="ml-2 text-red-600 text-xs font-bold">(Terlambat)</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase ${
                    loan.status === 'active' 
                      ? 'bg-green-100 text-green-600' 
                      : loan.status === 'overdue'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {loan.status === 'active' 
                      ? 'Aktif' 
                      : loan.status === 'overdue'
                      ? 'Terlambat'
                      : 'Dikembalikan'}
                  </span>
                  {loan.fine_amount && loan.fine_amount > 0 && (
                    <span className="text-red-600 text-[10px] font-bold mt-1">
                      Denda: Rp {loan.fine_amount.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RiwayatPeminjaman;