// src/components/dashboard/FinesSection.tsx
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Wallet } from "lucide-react";

// Mock Data for Tagihan Belum Lunas
const mockUnpaidFines = [
  { id: "1", name: "Rizqi Noor Fauzan", nim: "23051113", book: "Sistem Informasi Manajemen", lateDays: 2, total: "Rp. 1,000", status: "Belum Dibayar" },
  { id: "2", name: "Peter Schmeicel", nim: "230718272", book: "Algoritma & Pemrograman", lateDays: 6, total: "Rp. 3,000", status: "Belum Dibayar" },
  { id: "3", name: "Dr. Ferry Hartanto", nim: "192833315", book: "Metodologi Penelitian", lateDays: 1, total: "Rp. 500", status: "Belum Dibayar" },
  { id: "4", name: "Prof. Henderson", nim: "409180011", book: "Basis Data", lateDays: 3, total: "Rp. 1,500", status: "Belum Dibayar" },
];

// Mock Data for Riwayat Pembayaran
const mockPaidFines = [
  { id: "1", name: "Rizqi Noor Fauzan", nim: "23051113", date: "19 Feb 2026, 10:30", receiver: "Pustakawan 1", amount: "Rp. 3,000" },
  { id: "2", name: "Peter Schmeicel", nim: "230718272", date: "19 Feb 2026, 10:30", receiver: "Pustakawan 1", amount: "Rp. 3,000" },
  { id: "3", name: "Dr. Ferry Hartanto", nim: "192833315", date: "19 Feb 2026, 10:30", receiver: "Pustakawan 1", amount: "Rp. 3,000" },
  { id: "4", name: "Prof. Henderson", nim: "409180011", date: "19 Feb 2026, 10:30", receiver: "Pustakawan 1", amount: "Rp. 3,000" },
];

export default function FinesSection() {
  const [activeTab, setActiveTab] = useState<"unpaid" | "paid">("unpaid");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUnpaid = mockUnpaidFines.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPaid = mockPaidFines.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div>
        <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">Manajemen Denda</h2>
        <p className="text-slate-500 font-medium text-[15px] mt-1">
          Kelola tagihan keterlambatan dan riwayat denda mahasiswa.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setActiveTab("unpaid")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeTab === "unpaid" 
              ? "bg-white border-red-200 text-[#B91C1C] shadow-sm ring-1 ring-[#B91C1C]/10" 
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Tagihan Belum Lunas
        </button>
        <button 
          onClick={() => setActiveTab("paid")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeTab === "paid" 
              ? "bg-white border-red-200 text-[#B91C1C] shadow-sm ring-1 ring-[#B91C1C]/10" 
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Riwayat Pembayaran
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Bar */}
        <div className="p-6 flex flex-col sm:flex-row items-center justify-end border-b border-slate-50">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari NIM, Nama..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 transition-all outline-none placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {activeTab === "unpaid" ? (
                  <>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">NAMA</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">BUKU & KETERLAMBATAN</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">TOTAL DENDA</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">STATUS</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">NAMA</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">TANGGAL PEMBAYARAN</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">PUSTAKAWAN PENERIMA</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">NOMINAL LUNAS</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTab === "unpaid" ? (
                // UNPAID RENDER
                filteredUnpaid.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                      <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-semibold">Tidak ada tagihan denda belum lunas</p>
                    </td>
                  </tr>
                ) : (
                  filteredUnpaid.map((fine) => (
                    <tr key={fine.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors">{fine.name}</p>
                          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">{fine.nim}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{fine.book}</p>
                          <p className="text-[12px] font-medium text-red-500 mt-0.5">Terlambat {fine.lateDays} hari</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[14px] font-bold text-[#B91C1C]">{fine.total}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide bg-orange-50 text-orange-500 border border-orange-100">
                          {fine.status}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                // PAID RENDER
                filteredPaid.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                      <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-semibold">Tidak ada riwayat pembayaran</p>
                    </td>
                  </tr>
                ) : (
                  filteredPaid.map((fine) => (
                    <tr key={fine.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors">{fine.name}</p>
                          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">{fine.nim}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-500">{fine.date}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-500">{fine.receiver}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-[14px] font-bold text-green-600">{fine.amount}</p>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-6 border-t border-slate-50 flex items-center justify-end">
          <div className="flex items-center gap-1.5">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronLeft size={16} /> Prev
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#B91C1C] text-white text-sm font-bold shadow-md shadow-red-900/20">
              1
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 text-sm font-bold transition-colors">
              2
            </button>
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
