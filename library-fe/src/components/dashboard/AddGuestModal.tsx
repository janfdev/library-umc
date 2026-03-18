import { useState } from "react";
import { X } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddGuestModal({ isOpen, onClose, onRefresh }: AddGuestModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    faculty: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.nim || !formData.faculty) {
        alert("Semua kolom harus diisi!");
        setLoading(false);
        return;
      }

      // We attempt to send all fields; if backend only expects email, 
      // we can simulate an email from the NIM for now, or backend might be updated later.
      const payload = {
        name: formData.name.trim(),
        identifier: formData.nim.trim(),
        email: `${formData.nim.trim()}@student.umc.ac.id`,
        faculty: formData.faculty.trim(),
      };

      const res = await fetch(`${API_BASE_URL}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (data.success) {
        onRefresh();
        onClose();
        setFormData({ name: "", nim: "", faculty: "" });
      } else {
        alert("Gagal mencatat pengunjung: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-semibold text-slate-800 placeholder:text-slate-300 text-sm";
  const labelClass = "block text-[12px] font-extrabold text-[#0F172A] mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[600px] rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0F172A] px-6 py-5 flex items-center justify-between">
          <h2 className="text-white text-[16px] font-bold tracking-wide">Tambah Pengunjung</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          <div>
            <label className={labelClass}>Nama Pengunjung</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>NIM</label>
              <input 
                type="text" 
                required 
                value={formData.nim} 
                onChange={(e) => setFormData({ ...formData, nim: e.target.value })} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Fakultas</label>
              <input 
                type="text" 
                required 
                value={formData.faculty} 
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} 
                className={inputClass} 
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-[#B91C1C] hover:bg-[#9a1b1b] text-white rounded-xl text-sm font-bold shadow-md shadow-red-900/20 transition-all disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Pengunjung"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
