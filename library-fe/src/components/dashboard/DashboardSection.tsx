// src/components/dashboard/DashboardSection.tsx
import { Book, Users, Clock, Wallet } from "lucide-react";

interface DashboardSectionProps {
  stats: {
    totalCollections: number;
    totalCategories: number;
    totalGuests: number;
    activeBorrowings?: number;
    totalFines?: number;
  };
}

export default function DashboardSection({ stats }: DashboardSectionProps) {
  const statCards = [
    { 
      label: 'Total Koleksi', 
      value: stats.totalCollections, 
      icon: <Book />, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Sedang Dipinjam', 
      value: stats.activeBorrowings || 346, 
      icon: <Clock />, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'Anggota Aktif', 
      value: stats.totalGuests, 
      icon: <Users />, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      label: 'Denda Terkumpul', 
      value: `Rp ${(stats.totalFines || 50000).toLocaleString()}`, 
      icon: <Wallet />, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Ringkasan */}
      <div className="mb-8 text-left">
        <h2 className="text-2xl font-bold text-slate-900">Ringkasan Sistem</h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Pantau aktivitas perpustakaan hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all"
          >
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stat.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}