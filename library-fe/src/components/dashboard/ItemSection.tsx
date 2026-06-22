import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Search,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  QrCode,
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  X,
  RotateCcw,
  Ban,
} from "lucide-react";
import { itemApi, bibliographyApi, type Item, type Bibliography } from "@/api/client";
import { API_BASE_URL } from "@/utils/api-config";

export default function ItemSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/items?page=${page}&limit=${limit}${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal memuat data");
      const result = await response.json();
      setItems(result.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    setSearchTerm(searchInput);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const result = await itemApi.getById(id);
      setSelectedItem(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelectedItem(null);

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Arsipkan item "${item.itemCode}"?`)) return;
    try {
      await itemApi.delete(item.id);
      await fetchData();
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengarsipkan");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleBulkClose = () => {
    setShowBulkForm(false);
  };

  const handleBulkSuccess = async () => {
    setShowBulkForm(false);
    await fetchData();
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingItem(null);
    await fetchData();
  };

  // Detail View
  if (selectedItem) {
    return (
      <ItemDetail
        item={selectedItem}
        loading={detailLoading}
        onBack={closeDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={async () => {
          const result = await itemApi.getById(selectedItem.id);
          setSelectedItem(result.data);
        }}
      />
    );
  }

  // Form View
  if (showForm) {
    return (
      <ItemForm
        item={editingItem}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  // Bulk Form View
  if (showBulkForm) {
    return (
      <BulkCreateForm
        onClose={handleBulkClose}
        onSuccess={handleBulkSuccess}
      />
    );
  }

  // List View
  if (loading && items.length === 0) {
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
          onClick={fetchData}
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
          <h2 className="text-xl font-bold text-slate-900">Item / Eksemplar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola item fisik dari bibliografi
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari item..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#9F1515]"
          >
            Cari
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="size-4" />
            Tambah
          </button>
          <button
            onClick={() => setShowBulkForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Package className="size-4" />
            Bulk
          </button>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto mb-4 size-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600">Belum ada item</h3>
          <p className="mt-2 text-sm text-slate-400">
            Item akan muncul di sini setelah ditambahkan ke bibliografi
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Kode Item</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Bibliografi</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Lokasi</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">QR</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.itemCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.bibliography?.title || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.location
                        ? `${item.location.room}, ${item.location.rack}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "available"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "loaned"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.qrToken ? (
                        <QrCode className="mx-auto size-4 text-emerald-500" />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Lihat detail"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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
        </div>
      )}
    </div>
  );
}

// ==========================================
// ITEM DETAIL COMPONENT
// ==========================================

function ItemDetail({
  item,
  loading,
  onBack,
  onEdit,
  onDelete,
  onRefresh,
}: {
  item: Item;
  loading: boolean;
  onBack: () => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onRefresh: () => Promise<void>;
}) {
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerateQr = async () => {
    if (!confirm("Regenerate QR? QR lama akan invalid.")) return;
    setQrLoading(true);
    try {
      await itemApi.regenerateQr(item.id);
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal regenerate QR");
    } finally {
      setQrLoading(false);
    }
  };

  const handleRevokeQr = async () => {
    if (!confirm("Revoke QR? Scan tidak akan bisa resolve item ini.")) return;
    setQrLoading(true);
    try {
      await itemApi.revokeQr(item.id);
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal revoke QR");
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#B91C1C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

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
            onClick={() => onEdit(item)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Pencil className="size-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Trash2 className="size-4" />
            Arsipkan
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-slate-900">{item.itemCode}</h2>
        {item.bibliography && (
          <p className="mt-1 text-sm text-slate-500">{item.bibliography.title}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-slate-400">Kode Inventaris</dt>
            <dd className="mt-0.5 text-sm text-slate-900">{item.inventoryCode || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Call Number</dt>
            <dd className="mt-0.5 text-sm text-slate-900">{item.callNumber || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.status === "available"
                    ? "bg-emerald-50 text-emerald-700"
                    : item.status === "loaned"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-50 text-slate-600"
                }`}
              >
                {item.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Lokasi</dt>
            <dd className="mt-0.5 text-sm text-slate-900">
              {item.location
                ? `${item.location.room}, ${item.location.rack}, ${item.location.shelf}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Sumber</dt>
            <dd className="mt-0.5 text-sm text-slate-900">{item.source || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Harga</dt>
            <dd className="mt-0.5 text-sm text-slate-900">
              {item.price ? `${item.priceCurrency || "IDR"} ${item.price}` : "-"}
            </dd>
          </div>
        </div>
      </div>

      {/* QR Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <QrCode className="size-4" />
          QR Code
        </h3>
        {item.qrToken ? (
          <div className="flex items-start gap-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <img
                src={itemApi.getQrSvg(item.id)}
                alt="QR Code"
                className="size-32"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Versi: {item.qrVersion || 1}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateQr}
                  disabled={qrLoading}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <RotateCcw className="size-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleRevokeQr}
                  disabled={qrLoading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Ban className="size-4" />
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">QR code belum dibuat</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ITEM FORM COMPONENT
// ==========================================

function ItemForm({
  item,
  onClose,
  onSuccess,
}: {
  item: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bibliographies, setBibliographies] = useState<Bibliography[]>([]);
  const [formData, setFormData] = useState({
    bibliographyId: item?.bibliographyId || "",
    itemCode: item?.itemCode || "",
    inventoryCode: item?.inventoryCode || "",
    callNumber: item?.callNumber || "",
    status: item?.status || "available",
    source: item?.source || "",
    price: item?.price || "",
    priceCurrency: item?.priceCurrency || "IDR",
  });

  useEffect(() => {
    const loadBibliographies = async () => {
      try {
        const result = await bibliographyApi.list({ limit: 100 });
        setBibliographies(result.data.items);
      } catch {
        // ignore
      }
    };
    loadBibliographies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (item) {
        await itemApi.update(item.id, {
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined,
        });
      } else {
        await itemApi.create(formData.bibliographyId, {
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          {item ? "Edit Item" : "Tambah Item"}
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
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Informasi Item</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Bibliografi *</label>
              <select
                value={formData.bibliographyId}
                onChange={(e) => setFormData({ ...formData, bibliographyId: e.target.value })}
                required
                disabled={!!item}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C] disabled:bg-slate-100"
              >
                <option value="">Pilih bibliografi</option>
                {bibliographies.map((bib) => (
                  <option key={bib.id} value={bib.id}>{bib.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Kode Item *</label>
              <input
                type="text"
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Kode Inventaris</label>
              <input
                type="text"
                value={formData.inventoryCode}
                onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
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
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              >
                <option value="available">Tersedia</option>
                <option value="loaned">Dipinjam</option>
                <option value="reserved">Direservasi</option>
                <option value="maintenance">Maintenance</option>
                <option value="lost">Hilang</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Akuisisi</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Sumber</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Harga</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
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
            {item ? "Simpan Perubahan" : "Tambah Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// BULK CREATE FORM COMPONENT
// ==========================================

function BulkCreateForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bibliographies, setBibliographies] = useState<Bibliography[]>([]);
  const [selectedBibId, setSelectedBibId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [prefix, setPrefix] = useState("ITEM");
  const [locationId, setLocationId] = useState("");
  const [items, setItems] = useState<Array<{ itemCode: string; inventoryCode: string }>>([]);

  useEffect(() => {
    const loadBibliographies = async () => {
      try {
        const result = await bibliographyApi.list({ limit: 100 });
        setBibliographies(result.data.items);
      } catch {
        // ignore
      }
    };
    loadBibliographies();
  }, []);

  const generateItems = () => {
    const newItems = [];
    for (let i = 1; i <= quantity; i++) {
      const code = `${prefix}-${String(i).padStart(4, "0")}`;
      newItems.push({ itemCode: code, inventoryCode: "" });
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Generate item codes terlebih dahulu");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: { items: Array<{ itemCode: string; inventoryCode?: string; locationId?: number }>; defaults?: { locationId?: number } } = {
        items: items.map((item) => ({
          itemCode: item.itemCode,
          ...(item.inventoryCode ? { inventoryCode: item.inventoryCode } : {}),
        })),
      };
      if (locationId) {
        payload.defaults = { locationId: parseInt(locationId) };
      }
      const result = await itemApi.bulkCreate(selectedBibId, payload);
      setSuccess(`Berhasil membuat ${result.data.created} item`);
      setTimeout(() => onSuccess(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal bulk create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Bulk Create Item</h2>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
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

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Konfigurasi</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Bibliografi *</label>
              <select
                value={selectedBibId}
                onChange={(e) => setSelectedBibId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              >
                <option value="">Pilih bibliografi</option>
                {bibliographies.map((bib) => (
                  <option key={bib.id} value={bib.id}>{bib.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Jumlah Item *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                min="1"
                max="1000"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Prefix Kode Item</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Lokasi (ID)</label>
              <input
                type="number"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="Opsional"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#B91C1C] focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={generateItems}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Generate Kode
              </button>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Preview ({items.length} item)</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Item Code</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Inventory Code</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 20).map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="px-3 py-2 text-slate-600">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{item.itemCode}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.inventoryCode}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx] = { ...updated[idx], inventoryCode: e.target.value };
                            setItems(updated);
                          }}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length > 20 && (
                <p className="mt-2 text-xs text-slate-400">dan {items.length - 20} item lainnya...</p>
              )}
            </div>
          </div>
        )}

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
            disabled={loading || items.length === 0}
            className="flex items-center gap-2 rounded-lg bg-[#B91C1C] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#9F1515] disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Bulk Create ({items.length} item)
          </button>
        </div>
      </form>
    </div>
  );
}
