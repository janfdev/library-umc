// src/pages/AddCollectionPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Upload, Book, Info, Image as ImageIcon, CheckCircle2, X, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface Category {
  id: number;
  name: string;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_FILE_SIZE_MB = 1;

export default function AddCollectionPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
    publicationYear: "",
    isbn: "",
    type: "physical_book",
    categoryId: "",
    description: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  // Fungsi untuk kompres gambar
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Hitung dimensi baru (max 800px)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Kompres ke JPEG dengan kualitas 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setFileError('File harus berupa gambar');
      return;
    }

    // Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Ukuran file terlalu besar (max ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    try {
      setCoverFile(file);
      
      // Tampilkan preview dulu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Kompres gambar
      const compressedImage = await compressImage(file);
      
      // Ambil base64 tanpa prefix
      const base64Data = compressedImage.split(',')[1];
      setImageBase64(base64Data);
      
      console.log(`Ukuran asli: ${(file.size / 1024).toFixed(2)}KB`);
      console.log(`Ukuran setelah kompres: ~${(base64Data.length * 0.75 / 1024).toFixed(2)}KB`);
      
    } catch (error) {
      console.error("Error processing image:", error);
      setFileError("Gagal memproses gambar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi required fields
      if (!formData.title || !formData.author || !formData.publisher || 
          !formData.publicationYear || !formData.categoryId) {
        alert("Semua field harus diisi!");
        setLoading(false);
        return;
      }

      // Siapkan data untuk dikirim
      const collectionData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        publicationYear: parseInt(formData.publicationYear),
        isbn: formData.isbn?.trim() || null,
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        description: formData.description?.trim() || null,
        image: imageBase64, // Kirim base64 yang sudah dikompres
      };

      console.log("Ukuran data:", JSON.stringify(collectionData).length / 1024, "KB");

      const res = await fetch(`${API_BASE_URL}/api/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(collectionData),
      });

      if (res.status === 413) {
        throw new Error("File terlalu besar. Server tidak menerima request.");
      }

      const data = await res.json();
      
      if (data.success) {
        alert("Koleksi berhasil ditambahkan!");
        navigate("/dashboard/super-admin");
      } else {
        alert("Gagal menambahkan koleksi: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Opsi: Kirim tanpa gambar dulu untuk test
  const handleSubmitWithoutImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const collectionData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        publicationYear: parseInt(formData.publicationYear),
        isbn: formData.isbn?.trim() || null,
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        description: formData.description?.trim() || null,
        image: null, // Kirim null untuk test
      };

      const res = await fetch(`${API_BASE_URL}/api/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(collectionData),
      });

      const data = await res.json();
      
      if (data.success) {
        alert("Koleksi berhasil ditambahkan (tanpa gambar)!");
        navigate("/dashboard/super-admin");
      } else {
        alert("Gagal: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setCoverFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setFileError(null);
  };

  const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#9a1b1b]/5 focus:border-[#9a1b1b] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="mb-12">
          <Link
            to="/dashboard/super-admin"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#9a1b1b] font-bold text-xs transition-all mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            KEMBALI KE DASHBOARD
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Tambah Koleksi</h1>
          <p className="text-slate-400 font-medium italic text-sm">Lengkapi data inventaris buku fisik maupun digital.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Card 1: Media Upload */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-50 text-[#9a1b1b] rounded-lg"><ImageIcon size={20} /></div>
              <h3 className="font-bold text-xl text-slate-800 tracking-tight">Visual & Cover</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex-1">
                <label className={labelClass}>File Cover Buku</label>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handleImageChange} 
                  className="hidden" 
                  id="cover-upload" 
                />
                <label 
                  htmlFor="cover-upload" 
                  className={`flex flex-col items-center justify-center gap-4 w-full h-64 border-2 border-dashed rounded-[28px] cursor-pointer transition-all duration-300 group ${
                    fileError 
                      ? 'border-red-300 bg-red-50/30 hover:border-red-500' 
                      : 'border-slate-200 hover:border-[#9a1b1b] hover:bg-red-50/30'
                  }`}
                >
                  <div className={`p-4 rounded-full transition-colors ${
                    fileError ? 'bg-red-100' : 'bg-slate-50 group-hover:bg-white'
                  }`}>
                    <Upload className={`w-6 h-6 ${
                      fileError ? 'text-red-400' : 'text-slate-300 group-hover:text-[#9a1b1b]'
                    }`} />
                  </div>
                  <span className={`text-sm font-bold truncate max-w-[200px] ${
                    fileError ? 'text-red-500' : 'text-slate-600 group-hover:text-[#9a1b1b]'
                  }`}>
                    {coverFile ? coverFile.name : "Pilih Gambar"}
                  </span>
                </label>
                
                {fileError && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle size={12} />
                    <span>{fileError}</span>
                  </div>
                )}
                
                {coverFile && !fileError && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <X size={14} /> Hapus gambar
                  </button>
                )}
                
                <p className="text-[10px] text-slate-400 mt-2">
                  Format: JPG, PNG. Maksimal {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
              
              <div className="w-full md:w-56 text-center">
                 <label className={labelClass}>Preview</label>
                 <div className="w-full h-64 bg-slate-100 rounded-[28px] overflow-hidden border border-slate-100 flex items-center justify-center shadow-inner">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <Book size={40} className="opacity-20" />
                    )}
                 </div>
              </div>
            </div>
          </div>

          {/* Card 2: Metadata Form */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Info size={20} /></div>
              <h3 className="font-bold text-xl text-slate-800 tracking-tight">Detail Bibliografi</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>Judul Buku</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  className={inputClass} 
                  placeholder="Judul lengkap..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Penulis</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.author} 
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })} 
                    className={inputClass} 
                    placeholder="Nama penulis..." 
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
                    placeholder="Penerbit..." 
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
                    placeholder="2024" 
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
                    placeholder="978-602-1234-56-7" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Tipe Koleksi</label>
                  <select 
                    required 
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="physical_book">Buku Fisik</option>
                    <option value="ebook">E-Book</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Kategori</label>
                  <select 
                    required 
                    value={formData.categoryId} 
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Deskripsi</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  className={`${inputClass} min-h-[120px] resize-none`} 
                  placeholder="Sinopsis singkat..." 
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 items-center">
            <button 
              type="button" 
              onClick={() => navigate("/dashboard/super-admin")} 
              className="px-6 text-slate-400 font-bold text-sm hover:text-slate-600"
            >
              Batal
            </button>
            
            <div className="flex gap-2">
              {/* Tombol untuk test tanpa gambar */}
              <button 
                type="button"
                onClick={handleSubmitWithoutImage}
                disabled={loading}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              >
                Test Tanpa Gambar
              </button>
              
              <button 
                type="submit" 
                disabled={loading || !!fileError} 
                className="bg-[#9a1b1b] hover:bg-[#7a1515] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <><CheckCircle2 size={18} /> Simpan Koleksi</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}