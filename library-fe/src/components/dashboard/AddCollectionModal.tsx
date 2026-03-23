import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { cn } from "@/utils/utils";
import { API_BASE_URL } from "@/utils/api-config";
import Modal from "@/components/ui/modal";
import Notification from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";

interface Category {
  id: number;
  name: string;
}

interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  collection: Collection | null;
}

interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  isbn?: string;
  type: string;
  category?: {
    id: string | number;
    name: string;
  };
  categoryId: string | number;
  stock: number;
  image?: string;
}

export default function AddCollectionModal({ isOpen, onClose, onRefresh, collection }: AddCollectionModalProps) {
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
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { notifications, success, error, removeToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (collection) {
        setFormData({
          title: collection.title || "",
          author: collection.author || "",
          publisher: collection.publisher || "",
          publicationYear: collection.publicationYear?.toString() || "",
          isbn: collection.isbn || "",
          type: collection.type || "physical_book",
          categoryId: (collection.categoryId || collection.category?.id || "").toString(),
          stock: (collection.stock ?? 0).toString(),
          image: null,
        });
        setImagePreview(collection.image || null);
      } else {
        setFormData({
          title: "", author: "", publisher: "", publicationYear: "", isbn: "", type: "physical_book", categoryId: "", stock: "", image: null
        });
        setImagePreview(null);
      }
    }
  }, [isOpen, collection]);

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
  }; // Closing bracket for fetchCategories

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.author || !formData.categoryId) {
        error("Form Tidak Lengkap", "Judul, Pengarang, dan Kategori wajib diisi.");
        setLoading(false);
        return;
      }

      // Use FormData for file upload support
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("author", formData.author.trim());
      data.append("publisher", formData.publisher.trim());
      data.append("publicationYear", formData.publicationYear);
      data.append("isbn", formData.isbn?.trim() || "");
      data.append("type", formData.type);
      data.append("categoryId", formData.categoryId);
      data.append("stock", formData.stock);
      
      if (formData.image) {
        data.append("image", formData.image);
      }

      const url = collection 
        ? `${API_BASE_URL}/api/collections/${collection.id}`
        : `${API_BASE_URL}/api/collections`;
      
      const res = await fetch(url, {
        method: collection ? "PUT" : "POST",
        credentials: "include",
        body: data,
      });

      const responseData = await res.json(); // Renamed 'data' to 'responseData' to avoid conflict
      
      if (responseData.success) {
        success("Berhasil", collection ? "Data koleksi berhasil diperbarui." : "Data koleksi berhasil ditambahkan ke sistem.");
        onRefresh();
        onClose();
        // Reset form
        setFormData({
            title: "", author: "", publisher: "", publicationYear: "", isbn: "", type: "physical_book", categoryId: "", stock: "", image: null
        });
        setImagePreview(null);
      } else {
        error("Gagal Simpan", responseData.message || "Gagal menambahkan koleksi.");
      }
    } catch (err) {
      console.error("Error:", err);
      error("Sistem Error", "Terjadi gangguan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-semibold text-slate-800 placeholder:text-slate-300 text-sm";
  const labelClass = "block text-[12px] font-extrabold text-[#0F172A] mb-2";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={collection ? "Edit Koleksi Buku" : "Tambah Buku Baru"}
      size="lg"
    >
      {/* Modal Body / Form */}
      <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
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
        
        <div className="space-y-2">
          <label className={labelClass}>Cover Buku (JPG/PNG)</label>
          <div className={cn(
            "relative border-2 border-dashed rounded-[20px] transition-all duration-300 overflow-hidden",
            imagePreview ? "border-red-200 bg-red-50/10 h-48" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 h-32"
          )}>
            {imagePreview ? (
              <div className="relative h-full w-full flex items-center justify-center p-2">
                <img src={imagePreview} alt="Preview" className="h-full object-contain rounded-lg shadow-sm" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-all active:scale-95"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-slate-400">
                  <Upload size={18} />
                </div>
                <p className="text-[12px] font-bold text-slate-400">Upload Cover</p>
              </div>
            )}
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

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {notifications.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Notification
              {...t}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
