// src/pages/EditCollectionPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Save, Loader2, Book, Upload, X, Info, Image as ImageIcon } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface Category {
  id: number;
  name: string;
}

export default function EditCollectionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
    publicationYear: "",
    isbn: "",
    categoryId: "",
    description: "",
    type: "physical_book" as "physical_book" | "ebook" | "journal" | "thesis",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`);
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data || []);
        }

        const collectionRes = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
          credentials: "include",
        });
        const collectionData = await collectionRes.json();

        if (collectionData.success && collectionData.data) {
          const collection = collectionData.data;
          setFormData({
            title: collection.title || "",
            author: collection.author || "",
            publisher: collection.publisher || "",
            publicationYear: collection.publicationYear || "",
            isbn: collection.isbn || "",
            categoryId: collection.categoryId?.toString() || "",
            description: collection.description || "",
            type: collection.type || "physical_book",
          });
          setCurrentImage(collection.image || "");
        } else {
          alert("Koleksi tidak ditemukan");
          navigate("/dashboard/super-admin");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/dashboard/super-admin");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveNewImage = () => {
    setNewImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => submitData.append(key, value));
      if (newImageFile) submitData.append("cover", newImageFile);

      const res = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
        method: "PATCH",
        credentials: "include",
        body: submitData,
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Koleksi berhasil diperbarui!");
        navigate("/dashboard/super-admin");
      } else {
        alert(`❌ Gagal: ${data.message}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat memperbarui koleksi");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#9a1b1b]/5 focus:border-[#9a1b1b] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#9a1b1b] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="mb-10">
          <Link
            to="/dashboard/super-admin"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#9a1b1b] font-bold text-xs transition-all mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            KEMBALI KE DASHBOARD
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-100 text-[#9a1b1b]">
              <Book className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Edit Koleksi</h1>
              <p className="text-slate-400 font-medium italic text-sm">Perbarui informasi bibliografi dan metadata buku.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Card 1: Informasi Dasar */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Info size={20} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 tracking-tight">Data Bibliografi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Judul Koleksi *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputClass}
                  placeholder="Masukkan judul buku..."
                />
              </div>

              <div>
                <label className={labelClass}>Penulis / Pengarang *</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Penerbit *</label>
                <input
                  type="text"
                  required
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Tahun Terbit *</label>
                <input
                  type="text"
                  required
                  value={formData.publicationYear}
                  onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                  className={inputClass}
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

              <div>
                <label className={labelClass}>Kategori *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tipe Koleksi *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="physical_book">Buku Fisik</option>
                  <option value="ebook">E-Book</option>
                  <option value="journal">Jurnal</option>
                  <option value="thesis">Skripsi/Tesis</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Deskripsi / Sinopsis</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputClass} resize-none min-h-[120px]`}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Cover Image */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-50 text-[#9a1b1b] rounded-lg">
                <ImageIcon size={20} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 tracking-tight">Manajemen Cover</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
              <div className="space-y-4">
                <label className={labelClass}>Ganti Cover</label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="edit-upload" />
                  <label
                    htmlFor="edit-upload"
                    className="flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-slate-200 rounded-[24px] cursor-pointer hover:border-[#9a1b1b] hover:bg-red-50/30 transition-all duration-300 group"
                  >
                    <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors">
                      <Upload className="w-5 h-5 text-slate-300 group-hover:text-[#9a1b1b]" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{imagePreview ? "Ganti File Baru" : "Upload File Baru"}</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter text-center">Format: JPG, PNG, WebP (Max 5MB)</p>
              </div>

              <div className="flex justify-center gap-6">
                {/* Current Image */}
                {currentImage && !imagePreview && (
                  <div className="text-center">
                    <p className={labelClass}>Cover Saat Ini</p>
                    <div className="w-32 h-44 rounded-xl overflow-hidden shadow-md border border-slate-100">
                      <img src={currentImage} className="w-full h-full object-cover" alt="Current" />
                    </div>
                  </div>
                )}

                {/* New Preview */}
                {imagePreview && (
                  <div className="text-center">
                    <p className={`${labelClass} text-green-600 font-black tracking-widest`}>Pratinjau Baru</p>
                    <div className="relative w-32 h-44 group">
                      <img src={imagePreview} className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-[#9a1b1b]" alt="Preview" />
                      <button
                        type="button"
                        onClick={handleRemoveNewImage}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-600 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#9a1b1b] hover:bg-[#7a1515] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/super-admin")}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}