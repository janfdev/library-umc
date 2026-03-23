// src/components/dashboard/ReportsSection.tsx
import { useState, useEffect } from "react";
import { Users, BookCheck, DollarSign, ChevronDown, TrendingUp, DownloadCloud } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL } from "@/utils/api-config";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportsSectionProps {
  className?: string;
}

// Data statis untuk grafik kunjungan
const visitorsData = [
  { day: "Senin", visits: 45 },
  { day: "Selasa", visits: 60 },
  { day: "Rabu", visits: 35 },
  { day: "Kamis", visits: 50 },
  { day: "Jum'at", visits: 85 },
  { day: "Sabtu", visits: 40 },
  { day: "Minggu", visits: 15 },
];

const popularBooks = [
  { id: 1, title: "Bumi", borrows: 45 },
  { id: 2, title: "Sistem Informasi..", borrows: 39 },
  { id: 3, title: "Laskar Pelangi", borrows: 24 },
  { id: 4, title: "Pemrograman W..", borrows: 18 },
  { id: 5, title: "Kamus Inggris", borrows: 15 },
];

export default function ReportsSection({ className = "" }: ReportsSectionProps) {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    successfulLoans: 0,
    totalPaidFines: 0,
    visitsPastWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(visitorsData);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [guestsRes, loansRes, finesResUnpaid] = await Promise.all([
          fetch(`${API_BASE_URL}/api/guests`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/loans?status=returned&limit=500`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/fines?status=unpaid&limit=500`, { credentials: "include" }),
        ]);

        const [guestsData, loansData, finesUnpaidData] = await Promise.all([
          guestsRes.json(),
          loansRes.json(),
          finesResUnpaid.json(),
        ]);

        let guestsCount = 0;
        let visitsPastWeek = 0;
        let loansCount = 0;
        let finesSum = 0;
        
        const newChartData = [
          { day: "Minggu", visits: 0 },
          { day: "Senin", visits: 0 },
          { day: "Selasa", visits: 0 },
          { day: "Rabu", visits: 0 },
          { day: "Kamis", visits: 0 },
          { day: "Jum'at", visits: 0 },
          { day: "Sabtu", visits: 0 },
        ];

        if (guestsData.success && Array.isArray(guestsData.data)) {
          guestsCount = guestsData.data.length;
          
          const now = new Date();
          now.setHours(23, 59, 59, 999);
          
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
          sevenDaysAgo.setHours(0, 0, 0, 0);

          guestsData.data.forEach((guest: { createdAt?: string }) => {
             const guestDate = new Date(guest.createdAt || new Date());
             if (guestDate >= sevenDaysAgo && guestDate <= now) {
               visitsPastWeek++;
               const dayIndex = guestDate.getDay(); // 0 = Minggu
               newChartData[dayIndex].visits++;
             }
          });
          
          // Susun agar hari ini berada di posisi paling kanan grafik
          const sortedChartData = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayIdx = d.getDay();
            sortedChartData.push(newChartData[dayIdx]);
          }
          setChartData(sortedChartData);
        }

        if (loansData.success && Array.isArray(loansData.data)) {
          loansCount = loansData.data.length;
        }

        if (finesUnpaidData.success && Array.isArray(finesUnpaidData.data)) {
          finesSum += finesUnpaidData.data.reduce(
            (acc: number, item: { amount: number | string }) => acc + (Number(item.amount) || 0),
            0
          );
        }

        setStats({
          totalVisitors: guestsCount,
          successfulLoans: loansCount,
          totalPaidFines: finesSum,
          visitsPastWeek,
        });

      } catch (error) {
        console.error("Gagal mengambil data reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">Laporan & Statistik</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Metrik dan performa perpustakaan (Data Realtime API).</p>
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

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Pengunjung */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-full bg-[#EBF5FF] flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-[#2563EB]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              TOTAL PENGUNJUNG
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.totalVisitors}
            </p>
          </div>
        </div>

        {/* Peminjaman Sukses */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <BookCheck className="w-7 h-7 text-[#059669]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              PEMINJAMAN SUKSES
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.successfulLoans}
            </p>
          </div>
        </div>

        {/* Denda Terkumpul */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7 text-[#DC2626]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              TOTAL ESTIMASI DENDA
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `Rp ${(stats.totalPaidFines).toLocaleString('id-ID')}`
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Charts & Lists Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <h3 className="text-[15px] font-extrabold text-[#0F172A]">Grafik kunjungan terakhir</h3>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-[15px] font-extrabold text-[#0F172A]">(7 Hari Terakhir)</span>
              <ChevronDown className="w-5 h-5 text-slate-900" strokeWidth={3} />
            </div>
          </div>

          <div className="flex-1 w-full h-[300px] mb-6">
            <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }} barSize={50}>
                {/* Dummy Tooltip to hide default but support interaction if needed */}
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}
                />
                
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 700 }}
                  tickMargin={15}
                  height={40}
                />
                
                {/* Background bar to simulate the light grey background shown in screenshot */}
                <Bar 
                  dataKey="visits" 
                  fill="#9a1b1b" 
                  radius={[8, 8, 8, 8]} 
                  background={{ fill: '#F1F5F9', radius: 8 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t-2 border-slate-100 pt-5">
            <p className="text-center text-sm font-bold text-[#64748B]">
              Total : {stats.visitsPastWeek} pengunjung minggu ini
            </p>
          </div>
        </div>

        {/* Popular Books Section */}
        <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-extrabold text-[#0F172A]">Buku Terpopuler (Dummy*)</h3>
            <TrendingUp className="w-5 h-5 text-slate-900" strokeWidth={3} />
          </div>

          <div className="space-y-6 flex-1">
            {popularBooks.map((book) => (
              <div key={book.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {book.id}
                  </div>
                  <p className="text-sm font-bold text-[#0F172A] truncate max-w-[120px]">
                    {book.title}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#EBF5FF] text-[#2563EB] text-[10px] font-black tracking-wide shrink-0">
                  {book.borrows} Dipinjam
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}