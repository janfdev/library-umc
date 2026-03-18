// src/components/dashboard/ReportsSection.tsx
import { Users, BookCheck, DollarSign, ChevronDown, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReportsSectionProps {
  className?: string;
}

// Mock data matching the screenshot
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
  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">Laporan & Statistik</h2>
        <p className="text-sm text-slate-400 font-medium mt-1">Metrik dan performa perpustakaan.</p>
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
            <p className="text-3xl font-black text-slate-900">
              871
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
            <p className="text-3xl font-black text-slate-900">
              350
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
              DENDA TERKUMPUL
            </p>
            <p className="text-3xl font-black text-slate-900">
              Rp. 50,000
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }} barSize={50}>
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
              Total : 400 pengunjung minggu ini
            </p>
          </div>
        </div>

        {/* Popular Books Section */}
        <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-extrabold text-[#0F172A]">Buku Terpopuler</h3>
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