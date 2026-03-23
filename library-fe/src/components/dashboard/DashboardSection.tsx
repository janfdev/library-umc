import { Book, Users, Clock, Wallet, User as UserIcon, DownloadCloud } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      value: stats.activeBorrowings ?? 0, 
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
      value: `Rp ${(stats.totalFines ?? 0).toLocaleString()}`, 
      icon: <Wallet />, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Ringkasan */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ringkasan Sistem</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Pantau aktivitas perpustakaan hari ini.
          </p>
        </div>
        
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-800 transition-colors shadow-sm shadow-red-900/20">
              <DownloadCloud size={18} />
              Export Laporan
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100 bg-white">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Format Laporan (PDF)
            </div>
            <DropdownMenuItem 
              onClick={() => window.open(`${API_BASE_URL}/api/reports/loans/export?format=pdf`, '_blank')}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#B91C1C]"
            >
              Laporan Peminjaman
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`${API_BASE_URL}/api/reports/fines/export?format=pdf`, '_blank')}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#B91C1C]"
            >
              Laporan Denda
            </DropdownMenuItem>
            
            <div className="h-px bg-slate-100 my-1 mx-2" />
            
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Format Excel (CSV)
            </div>
            <DropdownMenuItem 
              onClick={() => window.open(`${API_BASE_URL}/api/reports/loans/export?format=csv`, '_blank')}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#1D4ED8]"
            >
              Laporan Peminjaman
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`${API_BASE_URL}/api/reports/fines/export?format=csv`, '_blank')}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#1D4ED8]"
            >
              Laporan Denda
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Aktivitas Peminjaman Terbaru */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 md:px-8 md:py-6 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Aktivitas Peminjaman Terbaru</h3>
          <button className="text-[#B91C1C] font-bold text-sm hover:underline flex items-center gap-1 group">
            Lihat Semua <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
        
        <div className="p-4 md:p-6 flex flex-col">
          {["Rizqi Noor Fauzan", "Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Nadilla Putri"].map((name, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center text-[#94A3B8]">
                  <UserIcon size={18} />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-slate-900">
                    {name} <span className="font-normal text-slate-400 mx-0.5">meminjam</span> Bumi
                  </p>
                  <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                    {idx * 2 + 2} Menit yang lalu
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="px-4 py-1.5 bg-[#ecfdf5] text-[#10b981] rounded-lg text-[13px] font-bold">
                  Selesai
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}