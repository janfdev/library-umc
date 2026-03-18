import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

interface Category {
  id: number;
  name: string;
}

interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddCollectionModal({ isOpen, onClose, onRefresh }: AddCollectionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
    publicationYear: "",
    isbn: "",
    type: "physical_book",
    categoryId: "",
    stock: "",
  });

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.author || !formData.categoryId) {
        alert("Judul, Penulis, dan Kategori harus diisi!");
        setLoading(false);
        return;
      }

      // Format payload using exact API expectations based on previous implementation
      const collectionData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim() || undefined,
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        isbn: formData.isbn?.trim() || null,
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        description: null,
        image: null, 
      };

      const res = await fetch(`${API_BASE_URL}/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(collectionData),
      });

      const data = await res.json();
      
      if (data.success) {
        onRefresh();
        onClose();
        // Reset form
        setFormData({
            title: "", author: "", publisher: "", publicationYear: "", isbn: "", type: "physical_book", categoryId: "", stock: ""
        });
      } else {
        alert("Gagal menambahkan koleksi: " + (data.message || "Unknown error"));
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
      <div className="bg-white w-full max-w-2xl rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0F172A] px-6 py-5 flex items-center justify-between">
          <h2 className="text-white text-[16px] font-bold tracking-wide">Tambah Buku Baru</h2>
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
            <label className={labelClass}>Judul Buku</label>
            <input 
              type="text" 
              required 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Pengarang</label>
              <input 
                type="text" 
                required 
                value={formData.author} 
                onChange={(e) => setFormData({ ...formData, author: e.target.value })} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Penerbit</label>
              <input 
                type="text" 
                required 
                value={formData.publisher} 
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} 
                className={inputClass} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Tahun Terbit</label>
              <input 
                type="number" 
                required 
                value={formData.publicationYear} 
                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })} 
                className={inputClass} 
                min="1000" 
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className={labelClass}>ISBN</label>
              <input 
                type="text" 
                value={formData.isbn} 
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} 
                className={inputClass} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Kategori</label>
              <select 
                required 
                value={formData.categoryId} 
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} 
                className={inputClass}
              >
                <option value="" disabled>Pilih Kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stok</label>
              <input 
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })} 
                className={inputClass}
                required
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
              {loading ? "Menyimpan..." : "Simpan Buku"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
