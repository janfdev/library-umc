import { useMemo, useState, Fragment } from "react";
import { RefreshCw, ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/dashboard/useAuditLogs";

const ACTION_OPTIONS = [
  "all",
  "create",
  "update",
  "delete",
  "approve",
  "blacklist",
  "failed_login",
  "rate_limited",
];
const ENTITY_OPTIONS = [
  "all",
  "loan",
  "item",
  "fine",
  "Users",
  "category",
  "bibliography",
  "reservation",
  "auth",
];

export default function AuditLogsSection() {
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { logs, loading, error, updateParams, refetch } = useAuditLogs(true, {
    limit: 100,
    offset: 0,
  });

  const applyFilter = async () => {
    setCurrentPage(1);
    await updateParams({
      action: action === "all" ? undefined : action,
      entity: entity === "all" ? undefined : entity,
      limit: 100,
      offset: 0,
    });
  };

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return logs;

    return logs.filter((log) => {
      const userId = (log.userId || "").toLowerCase();
      const userName = (log.user?.name || "").toLowerCase();
      const userEmail = (log.user?.email || "").toLowerCase();
      const entityId = (log.entityId || "").toLowerCase();
      const ipAddress = (log.ipAddress || "").toLowerCase();
      const detail = (log.detail || "").toLowerCase();
      return (
        userId.includes(keyword) ||
        userName.includes(keyword) ||
        userEmail.includes(keyword) ||
        entityId.includes(keyword) ||
        ipAddress.includes(keyword) ||
        detail.includes(keyword) ||
        log.action.toLowerCase().includes(keyword) ||
        log.entity.toLowerCase().includes(keyword)
      );
    });
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
          Audit Log Sistem
        </h2>
        <p className="text-slate-500 font-medium text-[15px] mt-1">
          Riwayat aktivitas sensitif super admin dan staff pada sistem.
        </p>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          <div className="relative w-full xl:max-w-[340px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama, email, userId, IP, detail..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 outline-none"
            />
          </div>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 bg-white"
          >
            {ACTION_OPTIONS.map((value) => (
              <option key={value} value={value}>
                Action: {value}
              </option>
            ))}
          </select>

          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 bg-white"
          >
            {ENTITY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                Entity: {value}
              </option>
            ))}
          </select>

          <button
            onClick={() => void applyFilter()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#B91C1C] text-white hover:bg-[#991b1b]"
          >
            <ShieldCheck size={14} /> Terapkan
          </button>

          <button
            onClick={() => void refetch()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-[#B91C1C] hover:bg-red-50 border border-slate-100"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm font-semibold">
            Tidak ada audit log yang cocok dengan filter.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Waktu
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Actor
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Action
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Entity
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Entity ID
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      IP Address
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {log.user?.name || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {log.user?.email || log.userId || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {log.entity}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {log.entityId || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[360px] break-all">
                        {log.detail || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-medium">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}–
                  {Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari {filteredLogs.length} data
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                    )
                    .map((p, idx, arr) => {
                      const showDot = idx > 0 && arr[idx - 1] !== p - 1;
                      return (
                        <Fragment key={p}>
                          {showDot && (
                            <span className="px-2 text-slate-300">...</span>
                          )}
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
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
