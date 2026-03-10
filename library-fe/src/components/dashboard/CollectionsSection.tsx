// src/components/dashboard/CollectionsSection.tsx
import { Link, useNavigate } from "react-router";
import { Plus, Edit, Trash2, Book, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  type: string;
  category: {
    name: string;
  };
  image: string | null;
}

interface CollectionsSectionProps {
  collections: Collection[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string, title: string) => void;
  onRefresh: () => void;
}

export default function CollectionsSection({ 
  collections, 
  searchTerm, 
  onSearchChange,
  onDelete,
  onRefresh
}: CollectionsSectionProps) {
  const navigate = useNavigate();

  const filteredCollections = collections.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 flex items-center justify-between border-b border-slate-50">
        <h3 className="text-xl font-bold text-slate-900">Koleksi Pustaka</h3>
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard/super-admin/collections/add" 
            className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 hover:bg-[#a01818] transition-all"
          >
            <Plus size={16} /> Tambah Koleksi
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
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Book className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Tidak ada data koleksi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <div 
                key={collection.id} 
                className="group bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[3/4] rounded-xl mb-4 overflow-hidden relative shadow-sm">
                  {collection.image ? (
                    <img 
                      src={collection.image} 
                      alt={collection.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <Book className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => navigate(`/dashboard/collections/edit/${collection.id}`)} 
                      className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(collection.id, collection.title)} 
                      className="p-3 bg-white text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <span className="px-3 py-1 rounded-full bg-red-50 text-[#B91C1C] text-[10px] font-bold uppercase tracking-wider">
                    {collection.category?.name || "Umum"}
                  </span>
                  <h3 className="font-bold text-slate-800 line-clamp-1 leading-tight">
                    {collection.title}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold italic">
                    {collection.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}