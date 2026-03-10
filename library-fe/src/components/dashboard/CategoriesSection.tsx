// src/components/dashboard/CategoriesSection.tsx
import { Link, useNavigate } from "react-router";
import { Plus, Edit, Trash2, Tag, ArrowRight } from "lucide-react";

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
  const navigate = useNavigate();

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 flex items-center justify-between border-b border-slate-50">
        <h3 className="text-xl font-bold text-slate-900">Kategori Buku</h3>
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard/super-admin/categories/add" 
            className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 hover:bg-[#a01818] transition-all"
          >
            <Plus size={16} /> Tambah Kategori
          </Link>
          <button 
            onClick={onRefresh}
            className="text-[#B91C1C] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat Semua <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Tidak ada data kategori</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <div 
                key={category.id} 
                className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-red-50 text-[#B91C1C]">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => navigate(`/dashboard/categories/edit/${category.id}`)} 
                      className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(category.id, category.name)} 
                      className="p-2 text-slate-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{category.name}</h3>
                <p className="text-slate-400 text-[11px] font-medium line-clamp-2">
                  {category.description || "Tidak ada deskripsi"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}