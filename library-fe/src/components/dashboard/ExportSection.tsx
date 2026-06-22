import { useState } from "react";
import {
  FileDown,
  Book,
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { exportApi } from "@/api/client";

export default function ExportSection() {
  const [exportingBiblio, setExportingBiblio] = useState(false);
  const [exportingItem, setExportingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBiblio, setSuccessBiblio] = useState(false);
  const [successItem, setSuccessItem] = useState(false);

  const handleExportBibliographies = async () => {
    setExportingBiblio(true);
    setError(null);
    setSuccessBiblio(false);
    try {
      await exportApi.downloadBibliographies();
      setSuccessBiblio(true);
      setTimeout(() => setSuccessBiblio(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export gagal");
    } finally {
      setExportingBiblio(false);
    }
  };

  const handleExportItems = async () => {
    setExportingItem(true);
    setError(null);
    setSuccessItem(false);
    try {
      await exportApi.downloadItems();
      setSuccessItem(true);
      setTimeout(() => setSuccessItem(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export gagal");
    } finally {
      setExportingItem(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Export Data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Export data bibliografi dan item ke format CSV
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Bibliography Export */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Book className="size-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Export Bibliografi</h3>
              <p className="text-xs text-slate-500">Format Senayan CSV</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Export semua data bibliografi dengan informasi penulis, subjek, dan kode item.
            Format: CSV dengan delimiter titik koma, encoding UTF-8 dengan BOM.
          </p>
          <p className="mb-4 text-xs text-slate-400">
            Catatan: Token QR dan ID internal tidak disertakan dalam export.
          </p>
          <button
            onClick={handleExportBibliographies}
            disabled={exportingBiblio}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B91C1C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#9F1515] disabled:opacity-50"
          >
            {exportingBiblio ? (
              <Loader2 className="size-4 animate-spin" />
            ) : successBiblio ? (
              <CheckCircle className="size-4" />
            ) : (
              <FileDown className="size-4" />
            )}
            {exportingBiblio ? "Mengexport..." : successBiblio ? "Berhasil!" : "Export Bibliografi"}
          </button>
        </div>

        {/* Item Export */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Package className="size-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Export Item / Eksemplar</h3>
              <p className="text-xs text-slate-500">Format Senayan CSV</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Export semua data item dengan informasi lokasi, status, dan metadata.
            Format: CSV dengan delimiter titik koma, encoding UTF-8 dengan BOM.
          </p>
          <p className="mb-4 text-xs text-slate-400">
            Catatan: Token QR dan UUID internal tidak disertakan dalam export.
          </p>
          <button
            onClick={handleExportItems}
            disabled={exportingItem}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {exportingItem ? (
              <Loader2 className="size-4 animate-spin" />
            ) : successItem ? (
              <CheckCircle className="size-4" />
            ) : (
              <FileDown className="size-4" />
            )}
            {exportingItem ? "Mengexport..." : successItem ? "Berhasil!" : "Export Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
