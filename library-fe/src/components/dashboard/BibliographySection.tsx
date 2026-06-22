import { useEffect, useState, useCallback } from "react";
import {
  Book,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  ArrowLeft,
  Users,
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { bibliographyApi, type Bibliography, type BibliographyListResponse } from "@/api/client";

interface BibliographySectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function BibliographySection({
  searchTerm,
  onSearchChange,
}: BibliographySectionProps) {
  const [data, setData] = useState<BibliographyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [selectedBib, setSelectedBib] = useState<Bibliography | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBib, setEditingBib] = useState<Bibliography | null>(null);
  const limit = 10;

  const fetchData = useCallback(async (pageNum: number, query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page: pageNum, limit };
      if (query) params.q = query;
      const result = await bibliographyApi.list(params);
      setData(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, searchTerm || undefined);
  }, [page, searchTerm, fetchData]);

  const handleSearch = () => {
    setPage(1);
    onSearchChange(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearchChange("");
    setPage(1);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const result = await bibliographyApi.getById(id);
      setSelectedBib(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelectedBib(null);

  const handleCreate = () => {
    setEditingBib(null);
    setShowForm(true);
  };

  const handleEdit = (bib: Bibliography) => {
    setEditingBib(bib);
    setShowForm(true);
  };

  const handleDelete = async (bib: Bibliography) => {
    if (!confirm(`Arsipkan bibliografi "${bib.title}"?`)) return;
    try {
      await bibliographyApi.delete(bib.id);
      await fetchData(page, searchTerm || undefined);
      if (selectedBib?.id === bib.id) setSelectedBib(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengarsipkan");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBib(null);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingBib(null);
    await fetchData(page, searchTerm || undefined);
  };

  // Detail View
  if (selectedBib) {
    return (
      <BibliographyDetail
        bib={selectedBib}
        loading={detailLoading}
        onBack={closeDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  // Form View
  if (showForm) {
    return (
      <BibliographyForm
        bib={editingBib}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  // List View
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#B91C1C]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 size-12 text-red-400" />
        <h3 className="text-lg font-semibold text-red-700">Error</h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={() => fetchData(page, searchTerm || undefined)}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <RefreshCw className="mr-2 inline size-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bibliografi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data bibliografi perpustakaan
            {data && (
              <span className="ml-2 text-[#B91C1C] font-semibold">
                ({data.total} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari bibliografi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#9F1515]"
          >
            Cari
          </button>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="size-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Table */}
      {!data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Book className="mx-auto mb-4 size-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600">
            {searchTerm ? "Tidak ada hasil" : "Belum ada bibliografi"}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            {searchTerm
              ? `Tidak ditemukan bibliografi untuk "${searchTerm}"`
              : "Bibliografi akan muncul di sini setelah ditambahkan"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Judul</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Penulis</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Penerbit</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Tahun</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">ISBN</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Stok</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((bib) => (
                  <tr key={bib.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate font-medium text-slate-900">
                        {bib.title}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate text-slate-600">
                        {bib.authors?.map((a) => a.name).join(", ") || "-"}
                        {bib.unlistedAuthorsLabel && (
                          <span className="ml-1 text-xs text-slate-400">
                            +{bib.unlistedAuthorsLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {bib.publisher?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {bib.publishYear || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {bib.isbnIssn || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Package className="size-3" />
                        {bib.availableItems}/{bib.totalItems}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(bib.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Lihat detail"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(bib)}
                          className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bib)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                          title="Arsipkan"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-500">
                Halaman {data.page} dari {data.totalPages} ({data.total} total)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// BIBLIOGRAPHY DETAIL COMPONENT
// ==========================================

function BibliographyDetail({
  bib,
  loading,
  onBack,
  onEdit,
  onDelete,
}: {
  bib: Bibliography;
  loading: boolean;
  onBack: () => void;
  onEdit: (bib: Bibliography) => void;
  onDelete: (bib: Bibliography) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#B91C1C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(bib)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Pencil className="size-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(bib)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Trash2 className="size-4" />
            Arsipkan
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{bib.title}</h2>
            {bib.sor && (
              <p className="mt-1 text-sm text-slate-500">{bib.sor}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <Package className="size-4" />
            {bib.availableItems}/{bib.totalItems} tersedia
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetaField label="ISBN/ISSN" value={bib.isbnIssn} />
          <MetaField label="Edisi" value={bib.edition} />
          <MetaField label="Penerbit" value={bib.publisher?.name} />
          <MetaField label="Tahun Terbit" value={bib.publishYear?.toString()} />
          <MetaField label="Bahasa" value={bib.language?.name} />
          <MetaField label="GMD" value={bib.gmd?.name} />
          <MetaField label="Call Number" value={bib.callNumber} />
          <MetaField label="Klasifikasi" value={bib.classification} />
          <MetaField label="Koleksi" value={bib.collation} />
          <MetaField label="Seri" value={bib.seriesTitle} />
          <MetaField label="Kategori" value={bib.category?.name} />
        </div>

        {/* Description */}
        {bib.description && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Deskripsi</h3>
            <p className="text-sm text-slate-600">{bib.description}</p>
          </div>
        )}

        {/* Notes */}
        {bib.notes && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Catatan</h3>
            <p className="text-sm text-slate-600">{bib.notes}</p>
          </div>
        )}
      </div>

      {/* Authors */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Users className="size-4" />
          Penulis
        </h3>
        {bib.authors && bib.authors.length > 0 ? (
          <div className="space-y-2">
            {bib.authors.map((author, idx) => (
              <div
                key={author.id || idx}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B91C1C] text-xs font-bold text-white">
                  {author.position}
                </span>
                <span className="font-medium text-slate-900">{author.name}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {author.role}
                </span>
              </div>
            ))}
            {bib.unlistedAuthorsLabel && (
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-2">
                <span className="text-xs text-amber-700">
                  + {bib.unlistedAuthorsLabel} (penulis lainnya)
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Tidak ada penulis tercatat</p>
        )}
      </div>

      {/* Subjects */}
      {bib.subjects && bib.subjects.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Tag className="size-4" />
            Subjek
          </h3>
          <div className="flex flex-wrap gap-2">
            {bib.subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {subject.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// BIBLIOGRAPHY FORM COMPONENT
// ==========================================

interface BibliographyFormProps {
  bib: Bibliography | null;
  onClose: () => void;
  onSuccess: () => void;
}

function BibliographyForm({ bib, onClose, onSuccess }: BibliographyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: bib?.title || "",
    isbnIssn: bib?.isbnIssn || "",
    edition: bib?.edition || "",
    publishYear: bib?.publishYear?.toString() || "",
    collation: bib?.collation || "",
    seriesTitle: bib?.seriesTitle || "",
    callNumber: bib?.callNumber || "",
    classification: bib?.classification || "",
    notes: bib?.notes || "",
    sor: bib?.sor || "",
    description: bib?.description || "",
    type: bib?.type || "physical_book",
  });

  const [authors, setAuthors] = useState<Array<{ name: string; role: string }>>(
    bib?.authors?.map((a) => ({ name: a.name, role: a.role })) || []
  );
  const [subjects, setSubjects] = useState<Array<{ name: string }>>(
    bib?.subjects?.map((s) => ({ name: s.name })) || []
  );
  const [unlistedAuthorsLabel, setUnlistedAuthorsLabel] = useState(bib?.unlistedAuthorsLabel || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        publishYear: formData.publishYear ? parseInt(formData.publishYear) : undefined,
        authors: authors.filter((a) => a.name.trim()),
        subjects: subjects.filter((s) => s.name.trim()),
        unlistedAuthorsLabel: unlistedAuthorsLabel || undefined,
      };

      if (bib) {
        await bibliographyApi.update(bib.id, payload);
      } else {
        await bibliographyApi.create(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const addAuthor = () => setAuthors([...authors, { name: "", role: "primary" }]);
  const removeAuthor = (idx: number) => setAuthors(authors.filter((_, i) => i !== idx));
  const updateAuthor = (idx: number, field: string, value: string) => {
    const updated = [...authors];
    updated[idx] = { ...updated[idx], [field]: value };
    setAuthors(updated);
  };

  const addSubject = () => setSubjects([...subjects, { name: "" }]);
  const removeSubject = (idx: number) => setSubjects(subjects.filter((_, i) => i !== idx));
  const updateSubject = (idx: number, value: string) => {
    const updated = [...subjects];
    updated[idx] = { name: value };
    setSubjects(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          {bib ? "Edit Bibliografi" : "Tambah Bibliografi"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-5" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Informasi Dasar</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Judul *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">ISBN/ISSN</label>
              <input
                type="text"
                value={formData.isbnIssn}
                onChange={(e) => setFormData({ ...formData, isbnIssn: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Edisi</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tahun Terbit</label>
              <input
                type="number"
                value={formData.publishYear}
                onChange={(e) => setFormData({ ...formData, publishYear: e.target.value })}
                min="1000"
                max="9999"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tipe</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              >
                <option value="physical_book">Buku Fisik</option>
                <option value="ebook">E-Book</option>
                <option value="journal">Jurnal</option>
                <option value="thesis">Skripsi</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Klasifikasi & Lokasi</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Call Number</label>
              <input
                type="text"
                value={formData.callNumber}
                onChange={(e) => setFormData({ ...formData, callNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Klasifikasi</label>
              <input
                type="text"
                value={formData.classification}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Koleksi</label>
              <input
                type="text"
                value={formData.collation}
                onChange={(e) => setFormData({ ...formData, collation: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Seri</label>
              <input
                type="text"
                value={formData.seriesTitle}
                onChange={(e) => setFormData({ ...formData, seriesTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Informasi Tambahan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">SOR (Statement of Responsibility)</label>
              <input
                type="text"
                value={formData.sor}
                onChange={(e) => setFormData({ ...formData, sor: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Penulis</h3>
            <button
              type="button"
              onClick={addAuthor}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              <Plus className="size-3" />
              Tambah Penulis
            </button>
          </div>
          <div className="space-y-3">
            {authors.map((author, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={author.name}
                  onChange={(e) => updateAuthor(idx, "name", e.target.value)}
                  placeholder="Nama penulis"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
                />
                <select
                  value={author.role}
                  onChange={(e) => updateAuthor(idx, "role", e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
                >
                  <option value="primary">Utama</option>
                  <option value="secondary">Pendamping</option>
                  <option value="editor">Editor</option>
                  <option value="translator">Penerjemah</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAuthor(idx)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Label Penulis Lainnya (Dkk)</label>
              <input
                type="text"
                value={unlistedAuthorsLabel}
                onChange={(e) => setUnlistedAuthorsLabel(e.target.value)}
                placeholder="cth: dkk"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Subjek</h3>
            <button
              type="button"
              onClick={addSubject}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              <Plus className="size-3" />
              Tambah Subjek
            </button>
          </div>
          <div className="space-y-3">
            {subjects.map((subject, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => updateSubject(idx, e.target.value)}
                  placeholder="Nama subjek"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
                />
                <button
                  type="button"
                  onClick={() => removeSubject(idx)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#B91C1C] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#9F1515] disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {bib ? "Simpan Perubahan" : "Tambah Bibliografi"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// META FIELD COMPONENT
// ==========================================

function MetaField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
