// src/components/dashboard/CirculationSection.tsx
import { useState } from "react";
import { ScanLine, LayoutGrid, Barcode } from "lucide-react";

export default function CirculationSection() {
  const [activeTab, setActiveTab] = useState<"borrow" | "return">("borrow");
  const [bookCode, setBookCode] = useState("");

  return (
    <div className="flex flex-col items-center justify-center pt-8 w-full max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Sirkulasi</h2>
        <p className="text-slate-400 font-medium text-[15px]">
          Scan barcode dari aplikasi mahasiswa atau barcode fisik buku.
        </p>
      </div>

      {/* Tabs / Switch */}
      <div className="flex items-center bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 w-full max-w-[500px]">
        <button
          onClick={() => setActiveTab("borrow")}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${
            activeTab === "borrow"
              ? "bg-white text-[#9a1b1b] shadow-sm ring-1 ring-slate-900/5"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Peminjaman Baru
        </button>
        <button
          onClick={() => setActiveTab("return")}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${
            activeTab === "return"
              ? "bg-white text-[#9a1b1b] shadow-sm ring-1 ring-slate-900/5"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Pengembalian Buku
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full h-[450px]">
        {/* Left Card: Input Mode */}
        <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#B91C1C] rounded-[24px] flex items-center justify-center text-white mb-6 shadow-lg shadow-red-900/20 group hover:scale-105 transition-transform duration-300">
            <ScanLine size={48} strokeWidth={1.5} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
            Mode {activeTab === "borrow" ? "Peminjaman" : "Pengembalian"}
          </h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mb-10">
            Silahkan arahkan scanner ke layar Hp mahasiswa atau ketik kode buku di bawah.
          </p>
          
          <div className="w-full relative mt-auto">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
              <Barcode size={24} />
            </div>
            <input
              type="text"
              value={bookCode}
              onChange={(e) => setBookCode(e.target.value)}
              placeholder="Masukkan kode buku disini"
              className="w-full pl-14 pr-24 py-4 bg-white border border-[#B91C1C]/40 focus:border-[#B91C1C] focus:ring-4 focus:ring-[#B91C1C]/10 rounded-[20px] text-slate-800 placeholder:text-slate-400 font-semibold transition-all outline-none"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#B91C1C] hover:bg-[#991b1b] text-white px-6 py-2.5 rounded-[14px] font-bold text-sm transition-colors shadow-sm">
              Cari
            </button>
          </div>
        </div>

        {/* Right Card: Result Placeholder */}
        <div className="bg-white rounded-[32px] p-10 border border-slate-100/50 shadow-sm flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center text-slate-300 animate-pulse">
            <LayoutGrid size={64} strokeWidth={1} className="mb-6 opacity-60" />
            <p className="text-slate-400 font-medium tracking-wide">Menunggu data pindaian...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
