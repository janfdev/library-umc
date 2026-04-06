import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  ArrowRight,
  Save,
  Loader
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
  onDelete,
  onRefresh
}: CategoriesSectionProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="p-8 flex items-center justify-between border-b border-slate-50">
        <h3 className="text-xl font-bold text-slate-900">Kategori Buku</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={openAddModal}
            className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 hover:bg-[#a01818] transition-all"
          >
            <Plus size={16} /> Tambah Kategori
          </button>
          <button
            onClick={onRefresh}
            className="text-[#B91C1C] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat Semua <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/30 rounded-[24px] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-900">Belum Ada Kategori</p>
            <p className="text-sm text-slate-400 mt-1">
              Mulai dengan menambahkan kategori buku baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
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
