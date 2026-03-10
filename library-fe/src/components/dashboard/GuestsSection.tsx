// src/components/dashboard/GuestsSection.tsx
import { Link } from "react-router";
import { Plus, Trash2, Users, ArrowRight, UserPlus } from "lucide-react";

interface GuestLog {
  id: string;
  name: string;
  email: string;
  identifier: string;
  faculty: string;
  major: string;
  visitDate: string;
}

interface GuestsSectionProps {
  guests: GuestLog[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string, name: string) => void;
  onRefresh: () => void;
}

export default function GuestsSection({ 
  guests, 
  searchTerm, 
  onSearchChange,
  onDelete,
  onRefresh
}: GuestsSectionProps) {
  const filteredGuests = guests.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.major.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 flex items-center justify-between border-b border-slate-50">
        <h3 className="text-xl font-bold text-slate-900">Data Pengunjung</h3>
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard/super-admin/guests/add" 
            className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 hover:bg-[#a01818] transition-all"
          >
            <UserPlus size={16} /> Tambah Pengunjung
          </Link>
          <button 
            onClick={onRefresh}
            className="text-[#B91C1C] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat Semua <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Tidak ada data pengunjung</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">Pengunjung</th>
                <th className="px-6 py-4 text-center">Identitas</th>
                <th className="px-6 py-4 text-center">Fakultas / Prodi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                        {guest.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{guest.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{guest.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold tracking-tight">
                      {guest.identifier}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-xs font-bold text-slate-700 uppercase">{guest.faculty}</p>
                    <p className="text-[10px] text-slate-400 font-medium italic">{guest.major}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => onDelete(guest.id, guest.name)} 
                      className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}