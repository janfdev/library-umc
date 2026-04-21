import { useState, Fragment } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  ArrowRight,
  Save,
  Loader,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Modal from "@/components/ui/modal";
import { API_BASE_URL } from "@/utils/api-config";
import { useToast } from "@/hooks/useToast";

interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

interface CategoriesSectionProps {
  categories: Category[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: number, name: string) => void;
  onRefresh: () => void;
}

export default function CategoriesSection({
  categories,
  searchTerm,
  onSearchChange,
  onDelete,
  onRefresh
}: CategoriesSectionProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ""
    });
    setIsModalOpen(true);
  };

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setCurrentPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error("Input Tidak Valid", "Nama kategori tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingCategory
        ? `${API_BASE_URL}/api/categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/categories`;

      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        success(
          "Berhasil",
          editingCategory ? "Kategori diperbarui" : "Kategori ditambahkan"
        );
        setIsModalOpen(false);
        onRefresh();
      } else {
        error("Gagal", data.message || "Gagal menyimpan kategori");
      }
    } catch {
      error("Sistem Error", "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Kategori Buku</h3>
          <p className="text-sm text-slate-400 font-medium">Kelola kategori untuk klasifikasi koleksi.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
             <input
                type="text"
                placeholder="Cari kategori..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 outline-none"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 hover:bg-[#a01818] transition-all shrink-0"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <div className="p-8">
        {paginatedCategories.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/30 rounded-[24px] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-900">Belum Ada Kategori</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? "Tidak ada kategori yang sesuai dengan pencarian." : "Mulai dengan menambahkan kategori buku baru."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCategories.map((category) => (
              <div
                key={category.id}
                className="group relative bg-white p-6 rounded-[24px] border border-slate-100 hover:border-red-100 hover:shadow-xl hover:shadow-red-900/5 transition-all duration-300 overflow-hidden"
              >
                {/* Decorative Background Element */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50/50 rounded-full blur-2xl group-hover:bg-red-100/50 transition-colors" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#B91C1C] group-hover:bg-[#B91C1C] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Tag className="w-6 h-6" strokeWidth={2.5} />
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all"
                        title="Edit Kategori"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(category.id, category.name)}
                        className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 hover:shadow-sm transition-all"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#B91C1C] transition-colors line-clamp-1">
                      {category.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 min-h-[40px]">
                      {category.description ||
                        "Kategori ini belum memiliki deskripsi tambahan."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      ID: #{category.id}
                    </span>
                    <div className="flex items-center gap-1.5 text-[#B91C1C] text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      Detail <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-50">
            <p className="text-xs text-slate-400 font-medium">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCategories.length)}–
              {Math.min(currentPage * itemsPerPage, filteredCategories.length)} dari {filteredCategories.length} kategori
            </p>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showDot = idx > 0 && arr[idx - 1] !== p - 1;
                  return (
                    <Fragment key={p}>
                      {showDot && <span className="px-2 text-slate-300">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                          currentPage === p
                            ? "bg-[#B91C1C] text-white shadow-md shadow-red-900/20"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    </Fragment>
                  );
                })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingCategory ? "Edit Kategori Buku" : "Tambah Kategori Baru"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Nama Kategori
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Contoh: Fiksi, Teknologi, dsb."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all outline-none text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Deskripsi (Opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Berikan deskripsi singkat kategori ini..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all outline-none text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-[2] bg-[#B91C1C] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#a01818] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Kategori
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
