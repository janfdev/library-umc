// src/components/dashboard/GuestsSection.tsx
import { useState } from "react";
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, Users, Edit, Trash2, UserPlus } from "lucide-react";
import AddGuestModal from "./AddGuestModal";
import AddMemberModal from "./AddMemberModal";

interface GuestLog {
  id: string;
  name: string;
  email: string;
  identifier: string;
  faculty: string;
  major: string;
  visitDate: string;
  createdAt?: string;
}

interface GuestsSectionProps {
  guests: GuestLog[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string, name: string) => void;
  onRefresh: () => void;
}

// Mock Data for Members matching the screenshot exactly
const mockMembers = [
  { id: "1", name: "Rizqi Noor Fauzan", nim: "23051113", type: "Mahasiswa", joined: "1 Februari 2025", status: "Aktif" },
  { id: "2", name: "Peter Schmeicel", nim: "230718272", type: "Mahasiswa", joined: "12 Januari 2025", status: "Aktif" },
  { id: "3", name: "Dr. Ferry Hartanto", nim: "192833315", type: "Dosen", joined: "12 Januari 2025", status: "Aktif" },
  { id: "4", name: "Prof. Henderson", nim: "409180011", type: "Dosen", joined: "10 November 2024", status: "Aktif" },
];

export default function GuestsSection({
  guests,
  searchTerm,
  onSearchChange,
  // onDelete, // Omitting usage in actual new Mock UI, but keeping prop signature
  onRefresh,
}: GuestsSectionProps) {
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"anggota" | "tamu">("anggota");

  const filteredGuests = guests.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.faculty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = mockMembers.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to format date
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const isToday = new Date().toDateString() === date.toDateString();
      const time = date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) {
        return `Hari ini, ${time}`;
      }
      return `${date.toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}, ${time}`;
    } catch {
      return "Waktu tidak diketahui";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">Manajemen Pengguna</h2>
          <p className="text-slate-500 font-medium text-[15px] mt-1">
            Kelola data keanggotaan dan riwayat pengunjung perpustakaan.
          </p>
        </div>
        
        {activeTab === "anggota" ? (
          <button 
            onClick={() => setIsMemberModalOpen(true)}
            className="bg-[#B91C1C] hover:bg-[#9a1b1b] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Anggota
          </button>
        ) : (
          <button 
            onClick={() => setIsGuestModalOpen(true)}
            className="bg-[#B91C1C] hover:bg-[#9a1b1b] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} /> Catat Pengunjung
          </button>
        )}
      </div>

      {/* Tabs Layout matching new designs: pills instead of bottom border */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setActiveTab("anggota")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeTab === "anggota" 
              ? "bg-white border-red-200 text-[#B91C1C] shadow-sm ring-1 ring-[#B91C1C]/10" 
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Daftar Anggota Aktif
        </button>
        <button 
          onClick={() => setActiveTab("tamu")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeTab === "tamu" 
              ? "bg-white border-red-200 text-[#B91C1C] shadow-sm ring-1 ring-[#B91C1C]/10" 
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Buku Tamu (Pengunjung)
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Bar */}
        <div className="p-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-b border-slate-50">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors border border-slate-100">
            Filter: <span className="font-medium text-slate-400">Tidak ada</span>
            <ChevronDown size={16} className="text-slate-400 ml-1" />
          </button>
          
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === "anggota" ? "Cari NIM, Nama..." : "Cari Nama, Fakultas..."}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 transition-all outline-none placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {activeTab === "tamu" ? (
                  <>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">WAKTU KEDATANGAN</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">NAMA PENGUNJUNG</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">FAKULTAS</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">INFORMASI ANGGOTA</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">TIPE AKUN</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">TANGGAL BERGABUNG</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">STATUS</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">AKSI</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTab === "tamu" ? (
                // BUKU TAMU RENDER
                filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-slate-400">
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-semibold">Tidak ada data pengunjung ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-400">
                          {formatDate(guest.visitDate || guest.createdAt || new Date().toISOString())}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors">{guest.name}</p>
                          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">{guest.identifier || "-"}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-400">{guest.faculty || "Umum"}</p>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                // DAFTAR ANGGOTA RENDER
                filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                      <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-semibold">Tidak ada data anggota ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors">{member.name}</p>
                          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">{member.nim}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-500">{member.type}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-500">{member.joined}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide bg-[#ecfdf5] text-[#10b981]">
                          {member.status}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                            title="Edit Data"
                          >
                            <Edit size={16} strokeWidth={2.5} />
                          </button>
                          <button 
                            className="p-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                            title="Hapus Data"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
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

      <AddGuestModal 
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onRefresh={onRefresh}
      />

      <AddMemberModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onRefresh={onRefresh}
      />
    </div>
  );
}
