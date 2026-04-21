// src/components/dashboard/CollectionsSection.tsx
import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye
} from "lucide-react";
import AddCollectionModal from "./AddCollectionModal";
import ViewCollectionModal from "./collections/ViewCollectionModal";

interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  type: string;
  category?: {
    id: string;
    name: string;
  };
  categoryId?: string | number;
  isbn?: string;
  stock: number;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const [viewingCollection, setViewingCollection] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const openAddModal = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const openEditModal = (collection: any) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const openViewModal = (collection: any) => {
    setViewingCollection(collection);
    setIsViewModalOpen(true);
  };

  const filteredCollections = collections.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.isbn && item.isbn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / itemsPerPage));
  const paginatedCollections = filteredCollections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
            Manajemen Koleksi
          </h2>
          <p className="text-slate-500 font-medium text-[15px] mt-1">
            Kelola data buku dan E-book.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#B91C1C] hover:bg-[#9a1b1b] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Buku Baru
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Bar */}
        <div className="p-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-b border-slate-50">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors border border-slate-100">
            Filter:{" "}
            <span className="font-medium text-slate-400">Tidak ada</span>
            <ChevronDown size={16} className="text-slate-400 ml-1" />
          </button>

          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari Judul, ISBN..."
              className="w-full pl-11 pr-4 py-2.5 text-black bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 transition-all outline-none placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  NO
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  BUKU
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  ISBN
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  KATEGORI
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  STOK
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  STATUS
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedCollections.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-semibold">
                      Tidak ada data koleksi ditemukan
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCollections.map((collection, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const stockValue = Number(collection.stock) || 0;
                  const statusInfo =
                    stockValue === 0
                      ? {
                          bg: "bg-orange-50",
                          text: "text-orange-500",
                          label: "Dipinjam"
                        }
                      : {
                          bg: "bg-[#ecfdf5]",
                          text: "text-[#10b981]",
                          label: "Tersedia"
                        };

                  return (
                    <tr
                      key={collection.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-slate-500">
                          {globalIndex}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors line-clamp-1 max-w-[250px]">
                            {collection.title}
                          </p>
                          <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                            {collection.author || "Anonim"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-medium text-slate-500">
                          {collection.isbn || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-semibold text-[#3b82f6]/80 capitalize">
                          {collection.category?.name || "Tanpa Kategori"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-bold text-slate-700">
                          {stockValue}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {statusInfo.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(collection)}
                            className="p-2 text-slate-400 hover:text-[#B91C1C] hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                            title="Lihat Detail"
                          >
                            <Eye size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => openEditModal(collection)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                            title="Edit Data"
                          >
                            <Edit size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() =>
                              onDelete(collection.id, collection.title)
                            }
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                            title="Hapus Data"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium">
            Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCollections.length)}–
            {Math.min(currentPage * itemsPerPage, filteredCollections.length)} dari {filteredCollections.length} koleksi
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
                  <div key={p} className="flex items-center">
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
                  </div>
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
      </div>

      <AddCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={onRefresh}
        collection={editingCollection}
        allCollections={collections}
      />

      <ViewCollectionModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        collection={viewingCollection}
      />
    </div>
  );
}
