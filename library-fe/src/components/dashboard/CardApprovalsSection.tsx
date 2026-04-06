import { useEffect, useState } from "react";
import { BadgeCheck, RefreshCw, UserCheck, UserX, IdCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import {
  usersManagementService,
  type PendingMemberCardRequest
} from "@/services/dashboard/usersManagementService";

export default function CardApprovalsSection() {
  const { success, error, warning } = useToast();
  const [items, setItems] = useState<PendingMemberCardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await usersManagementService.getPendingCardRequests();
      setItems(data);
    } catch (err) {
      console.error(err);
      error("Gagal", "Gagal memuat pengajuan kartu", 4000);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.user.name.toLowerCase().includes(q) ||
      item.user.email.toLowerCase().includes(q) ||
      (item.nimNidn || "").toLowerCase().includes(q)
    );
  });

  const handleApprove = async (item: PendingMemberCardRequest) => {
    setActionId(item.id);
    try {
      await usersManagementService.approveMemberCard(item.id);
      success("Berhasil", `Kartu member ${item.user.name} disetujui`, 3000);
      await loadRequests();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal approve kartu";
      error("Gagal", message, 4000);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (item: PendingMemberCardRequest) => {
    const reason = window.prompt(`Alasan penolakan untuk ${item.user.name}:`);
    if (reason === null) return;
    if (!reason.trim()) {
      warning("Perhatian", "Alasan penolakan wajib diisi", 3000);
      return;
    }

    setActionId(item.id);
    try {
      await usersManagementService.rejectMemberCard(item.id, reason.trim());
      success("Berhasil", `Kartu member ${item.user.name} ditolak`, 3000);
      await loadRequests();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menolak kartu";
      error("Gagal", message, 4000);
    } finally {
      setActionId(null);
    }
  };

  const handleIssueDirect = async (item: PendingMemberCardRequest) => {
    setActionId(item.id);
    try {
      await usersManagementService.issueMemberCard(item.userId);
      success("Berhasil", `Kartu member ${item.user.name} diterbitkan`, 3000);
      await loadRequests();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menerbitkan kartu";
      error("Gagal", message, 4000);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
          Persetujuan Kartu Member
        </h2>
        <p className="text-slate-500 font-medium text-[15px] mt-1">
          Kelola pengajuan kartu member yang menunggu persetujuan admin.
        </p>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-[360px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau NIM/NIDN..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 outline-none"
            />
          </div>

          <button
            onClick={() => void loadRequests()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-[#B91C1C] hover:bg-red-50 border border-slate-100 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <IdCard size={42} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Tidak ada pengajuan kartu pending</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 hover:bg-slate-50/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center font-black">
                    {item.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {item.user.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <BadgeCheck size={12} /> Pending
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{item.user.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      NIM/NIDN: {item.nimNidn || "-"} · Fakultas:{" "}
                      {item.faculty || "-"} · Telp: {item.phone || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    onClick={() => void handleApprove(item)}
                    disabled={actionId === item.id}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                  >
                    <UserCheck size={14} />
                    Setujui
                  </button>
                  <button
                    onClick={() => void handleReject(item)}
                    disabled={actionId === item.id}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    <UserX size={14} />
                    Tolak
                  </button>
                  <button
                    onClick={() => void handleIssueDirect(item)}
                    disabled={actionId === item.id}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B91C1C] text-white text-sm font-bold hover:bg-[#991b1b] disabled:opacity-50"
                  >
                    <IdCard size={14} />
                    Terbitkan Langsung
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
