// src/components/dashboard/ReportsSection.tsx
import { useState } from "react";
import { Link } from "react-router";
import {
  Eye,
  BookOpen,
  Wallet,
  Calendar,
  ArrowRight,
  Clock,
  Award,
  ChevronUp,
  ChevronDown,
  TrendingUp
} from "lucide-react";

interface ReportsSectionProps {
  className?: string;
}

// Mock data
const mockStats = {
  totalVisitors: 871,
  totalBorrowings: 350,
  totalFines: 50000,
  weeklyVisitors: 400,
  visitorsTrend: 12,
  borrowingsTrend: 8,
  finesTrend: -5,
  popularBooks: [
    { title: "Duril", author: "Ahmad Tohari", borrowCount: 45 },
    { title: "Sistem Informasi", author: "Jogiyanto", borrowCount: 38 },
    { title: "Lasikar Pelangi", author: "Andrea Hirata", borrowCount: 32 },
    { title: "Penerapannya W.", author: "John Doe", borrowCount: 28 },
    { title: "Kamus Inggris", author: "Oxford", borrowCount: 25 },
  ],
  dailyVisits: [
    { day: "Senin", visits: 65 },
    { day: "Selasa", visits: 72 },
    { day: "Rabu", visits: 58 },
    { day: "Kamis", visits: 84 },
    { day: "Jumat", visits: 91 },
    { day: "Sabtu", visits: 120 },
    { day: "Minggu", visits: 45 },
  ],
  categoryStats: [
    { name: "Fiksi", count: 120, percentage: 35 },
    { name: "Non-Fiksi", count: 85, percentage: 25 },
    { name: "Teknologi", count: 64, percentage: 19 },
    { name: "Bisnis", count: 42, percentage: 12 },
    { name: "Sejarah", count: 31, percentage: 9 },
  ],
  recentActivities: [
    { id: "1", type: "borrow", description: "Buku 'Duril' dipinjam oleh Ahmad", timestamp: "2 menit lalu" },
    { id: "2", type: "visit", description: "Pengunjung baru: Siti Aminah", timestamp: "15 menit lalu" },
    { id: "3", type: "return", description: "Buku 'Sistem Informasi' dikembalikan", timestamp: "1 jam lalu" },
    { id: "4", type: "borrow", description: "Buku 'Lasikar Pelangi' dipinjam", timestamp: "3 jam lalu" },
  ]
};

const COLORS = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];

export default function ReportsSection({ className = "" }: ReportsSectionProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp');
  };

  const maxVisits = Math.max(...mockStats.dailyVisits.map(d => d.visits));

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header dengan Time Range Selector */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Laporan & Statistik</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">Metrik dan performa perpustakaan</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[
            { value: 'week', label: 'Minggu' },
            { value: 'month', label: 'Bulan' },
            { value: 'year', label: 'Tahun' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                timeRange === range.value
                  ? 'bg-[#B91C1C] text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards - 3 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Pengunjung */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium">
              {getTrendIcon(mockStats.visitorsTrend)}
              <span className={mockStats.visitorsTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(mockStats.visitorsTrend)}%
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            TOTAL PENGUNJUNG
          </p>
          <p className="text-3xl font-black text-slate-900 mb-1">
            {mockStats.totalVisitors.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">
            <span className="font-bold text-slate-700">{mockStats.weeklyVisitors}</span> minggu ini
          </p>
        </div>

        {/* Total Peminjaman */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium">
              {getTrendIcon(mockStats.borrowingsTrend)}
              <span className={mockStats.borrowingsTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(mockStats.borrowingsTrend)}%
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            PEMINJAMAN BUKU
          </p>
          <p className="text-3xl font-black text-slate-900 mb-1">
            {mockStats.totalBorrowings.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">
            <span className="font-bold text-slate-700">128</span> peminjaman aktif
          </p>
        </div>

        {/* Total Denda */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <Wallet className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium">
              {getTrendIcon(mockStats.finesTrend)}
              <span className={mockStats.finesTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(mockStats.finesTrend)}%
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            DENDA TERKUMPUL
          </p>
          <p className="text-3xl font-black text-slate-900 mb-1">
            {formatCurrency(mockStats.totalFines)}
          </p>
          <p className="text-xs text-slate-400">
            <span className="font-bold text-slate-700">12</span> anggota terkena denda
          </p>
        </div>
      </div>

      {/* Grafik dan Buku Populer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Kunjungan */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grafik Kunjungan</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">7 Hari Terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-700">
                Total: {mockStats.weeklyVisitors} pengunjung
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {mockStats.dailyVisits.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-14 text-xs font-medium text-slate-500">{item.day}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-[#B91C1C] rounded-lg flex items-center justify-end px-3 text-white text-xs font-bold"
                    style={{ width: `${(item.visits / maxVisits) * 100}%` }}
                  >
                    {item.visits}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buku Terpopuler */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Buku Terpopuler</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Berdasarkan peminjaman</p>
            </div>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>

          <div className="space-y-4">
            {mockStats.popularBooks.map((book, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-50 text-[#B91C1C] flex items-center justify-center font-black text-xs">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{book.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-sm">{book.borrowCount}</p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider">kali</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistik Tambahan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Kategori */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-base font-bold text-slate-900 mb-4">Distribusi Koleksi per Kategori</h3>
          
          <div className="space-y-4">
            {mockStats.categoryStats.map((cat, idx) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${COLORS[idx % COLORS.length]}`} />
                    <span className="text-xs text-slate-600">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{cat.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${COLORS[idx % COLORS.length]} rounded-full`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Aktivitas Terbaru</h3>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-3">
            {mockStats.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`p-1.5 rounded-lg ${
                  activity.type === 'borrow' ? 'bg-green-50' :
                  activity.type === 'return' ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  {activity.type === 'borrow' && <BookOpen className="w-3.5 h-3.5 text-green-600" />}
                  {activity.type === 'return' && <BookOpen className="w-3.5 h-3.5 text-blue-600" />}
                  {activity.type === 'visit' && <Eye className="w-3.5 h-3.5 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{activity.description}</p>
                  <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <Clock size={9} /> {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}