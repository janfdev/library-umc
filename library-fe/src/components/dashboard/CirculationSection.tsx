import { useState } from "react";
import { Loader2, AlertCircle, QrCode, CheckCircle, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/utils/api-config";

interface ItemResult {
  item: {
    id: string;
    itemCode: string;
    title: string;
    status: string;
    location: string;
  };
  activeLoan: any;
  allowedActions: string[];
}

interface LoanResult {
  loan: {
    id: string;
    loanCode: string;
    memberId: string;
    itemId: string;
    status: string;
    loanDate: string;
    dueDate: string;
  };
  message: string;
}

interface ReturnResult {
  success: boolean;
  message: string;
  fine?: {
    id: string;
    overdueDays: number;
    assessedAmount: string;
    status: string;
  };
}

export default function CirculationSection() {
  const [mode, setMode] = useState<"scan" | "result" | "loan" | "return" | "fine">("scan");
  const [scanInput, setScanInput] = useState("");
  const [scanType, setScanType] = useState<"qr" | "code">("code");
  const [intent, setIntent] = useState<"inspect" | "loan" | "return">("inspect");
  const [itemResult, setItemResult] = useState<ItemResult | null>(null);
  const [loanResult, setLoanResult] = useState<LoanResult | null>(null);
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = scanType === "qr" ? "/api/qr/scan" : "/api/qr/lookup";
      const body = scanType === "qr"
        ? { token: scanInput.trim(), intent }
        : { itemCode: scanInput.trim(), intent };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Item not found");
        return;
      }
      setItemResult(data.data);
      setMode("result");
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoan = async () => {
    if (!itemResult) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberId: "current-user", bibliographyId: itemResult.item.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Loan failed");
        return;
      }
      setLoanResult(data.data ? { loan: data.data, message: data.message } : { loan: null, message: data.message });
      setMode("loan");
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (condition: string) => {
    if (!itemResult) return;
    setLoading(true);
    setError(null);
    try {
      const loanId = itemResult.activeLoan?.id || "current-loan";
      const res = await fetch(`${API_BASE_URL}/api/loans/${loanId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ condition }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Return failed");
        return;
      }
      setReturnResult(data);
      setMode("fine");
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode("scan");
    setScanInput("");
    setItemResult(null);
    setLoanResult(null);
    setReturnResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Sirkulasi</h2>
        <p className="mt-1 text-sm text-slate-500">QR Scan, Peminjaman, dan Pengembalian</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {mode === "scan" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Scan / Lookup Item</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value as "qr" | "code")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="code">Item Code</option>
                <option value="qr">QR Token</option>
              </select>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as "inspect" | "loan" | "return")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="inspect">Inspect</option>
                <option value="loan">Loan</option>
                <option value="return">Return</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={scanType === "qr" ? "Masukkan QR token..." : "Masukkan kode item..."}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                onClick={handleScan}
                disabled={loading || !scanInput.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#9F1515] disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
                {scanType === "qr" ? "Scan" : "Lookup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "result" && itemResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Item Found</h3>
            <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="size-4 inline mr-1" /> Kembali
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-400">Item Code</dt><dd className="text-sm font-medium">{itemResult.item.itemCode}</dd></div>
            <div><dt className="text-xs text-slate-400">Title</dt><dd className="text-sm font-medium">{itemResult.item.title}</dd></div>
            <div><dt className="text-xs text-slate-400">Status</dt><dd className="text-sm font-medium">{itemResult.item.status}</dd></div>
            <div><dt className="text-xs text-slate-400">Location</dt><dd className="text-sm font-medium">{itemResult.item.location}</dd></div>
          </div>
          <div className="mt-4 flex gap-2">
            {itemResult.allowedActions.includes("loan") && (
              <button onClick={handleLoan} disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#9F1515] disabled:opacity-50">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                Pinjam
              </button>
            )}
            {itemResult.allowedActions.includes("return") && (
              <>
                <button onClick={() => handleReturn("good")} disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  Kembalikan (Baik)
                </button>
                <button onClick={() => handleReturn("damaged")} disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                  Kembalikan (Rusak)
                </button>
                <button onClick={() => handleReturn("lost")} disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  Kembalikan (Hilang)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {mode === "loan" && loanResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="mb-2 text-sm font-semibold text-emerald-700">Peminjaman Berhasil</h3>
          <p className="text-sm text-emerald-600">{loanResult.message}</p>
          {loanResult.loan && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-400">Status</dt><dd className="text-sm font-medium">{loanResult.loan.status}</dd></div>
              <div><dt className="text-xs text-slate-400">Jatuh Tempo</dt><dd className="text-sm font-medium">{loanResult.loan.dueDate}</dd></div>
            </div>
          )}
          <button onClick={reset} className="mt-4 text-sm text-emerald-700 hover:underline">
            <ArrowLeft className="size-4 inline mr-1" /> Kembali ke scan
          </button>
        </div>
      )}

      {mode === "fine" && returnResult && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-sm font-semibold text-blue-700">Pengembalian Berhasil</h3>
          <p className="text-sm text-blue-600">{returnResult.message}</p>
          {returnResult.fine && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-700">Denda</p>
              <div className="grid gap-2 sm:grid-cols-3 mt-2">
                <div><dt className="text-xs text-slate-400">Hari Terlambat</dt><dd className="text-sm font-medium">{returnResult.fine.overdueDays}</dd></div>
                <div><dt className="text-xs text-slate-400">Jumlah</dt><dd className="text-sm font-medium">Rp {returnResult.fine.assessedAmount}</dd></div>
                <div><dt className="text-xs text-slate-400">Status</dt><dd className="text-sm font-medium">{returnResult.fine.status}</dd></div>
              </div>
            </div>
          )}
          <button onClick={reset} className="mt-4 text-sm text-blue-700 hover:underline">
            <ArrowLeft className="size-4 inline mr-1" /> Kembali ke scan
          </button>
        </div>
      )}
    </div>
  );
}
