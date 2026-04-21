import { useEffect, useMemo, useState, Fragment } from "react";
import {
  Search,
  RefreshCw,
  Users2,
  ShieldCheck,
  UserX,
  Save,
  Link,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/utils/auth-client";
import { useToast } from "@/hooks/useToast";
import { useUsersManagement } from "@/hooks/dashboard/useUsersManagement";
import { usersManagementService } from "@/services/dashboard/usersManagementService";
import { dashboardDataService } from "@/services/dashboard/dashboardDataService";

export default function UsersSection() {
  const { data: session } = authClient.useSession();
  const { success, error: showErrorToast, warning } = useToast();

  const {
    users,
    loading,
    error: usersError,
    stats,
    refetch
  } = useUsersManagement(true);

  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [banSavingId, setBanSavingId] = useState<string | null>(null);
  const [syncSavingId, setSyncSavingId] = useState<string | null>(null);
  const [issueSavingId, setIssueSavingId] = useState<string | null>(null);
  const [recordSavingId, setRecordSavingId] = useState<string | null>(null);
  const [showOnlyUnsynced, setShowOnlyUnsynced] = useState(false);
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!users.length) return;
    setRoleDraft((prev) => {
      const next = { ...prev };
      for (const user of users) {
        next[user.id] = user.role;
      }
      return next;
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = showOnlyUnsynced
      ? users.filter((u) => !u.hasSyncedMember)
      : users;

    if (!q) return list;

    return list.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, search, showOnlyUnsynced]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const roleBadgeClass = (role: string) => {
    if (role === "super_admin") return "bg-red-50 text-red-700 border-red-200";
    if (role === "staff") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const cardStatusLabel = (status?: string | null) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "pending":
        return "Menunggu";
      case "rejected":
        return "Ditolak";
      case "expired":
        return "Kedaluwarsa";
      default:
        return "Belum Ajukan";
    }
  };

  const cardStatusClass = (status?: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "expired":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const handleUpdateRole = async (user: (typeof users)[number]) => {
    const nextRole = roleDraft[user.id] || user.role;
    if (!nextRole || nextRole === user.role) {
      warning(
        "Tidak Ada Perubahan",
        "Role yang dipilih sama dengan role saat ini."
      );
      return;
    }

    setSavingId(user.id);
    setPageError(null);
    try {
      await usersManagementService.updateRole(user.id, nextRole);
      await refetch();
      success(
        "Role Diperbarui",
        `Role ${user.name} berhasil diubah menjadi ${nextRole}.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memperbarui role user";
      setPageError(message);
      showErrorToast("Update Role Gagal", message);
    } finally {
      setSavingId(null);
    }
  };

  const currentUserId = session?.user?.id;

  const handleToggleBan = async (user: (typeof users)[number]) => {
    const nextBanned = !user.banned;
    let banReason: string | undefined;

    if (nextBanned) {
      const reason = window.prompt(
        "Alasan ban user (opsional):",
        "Pelanggaran kebijakan sistem"
      );
      if (reason === null) return;
      banReason = reason.trim() || undefined;
    }

    setBanSavingId(user.id);
    setPageError(null);
    try {
      await usersManagementService.updateBanStatus(
        user.id,
        nextBanned,
        banReason
      );
      await refetch();
      if (nextBanned) {
        success("User Diblokir", `${user.name} berhasil diban.`);
      } else {
        success("User Diaktifkan", `${user.name} berhasil di-unban.`);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status ban user";
      setPageError(message);
      showErrorToast("Update Status User Gagal", message);
    } finally {
      setBanSavingId(null);
    }
  };

  const handleSyncMember = async (user: (typeof users)[number]) => {
    setSyncSavingId(user.id);
    setPageError(null);
    try {
      const result = await usersManagementService.syncMemberByUserId(user.id);
      const mode = String(result?.data?.mode || "updated");
      await refetch();
      success(
        "Sinkronisasi Berhasil",
        `Member ${user.name} berhasil disinkronkan (${mode}).`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal sinkronisasi member";
      setPageError(message);
      showErrorToast("Sync Member Gagal", message);
    } finally {
      setSyncSavingId(null);
    }
  };

  const handleIssueCard = async (user: (typeof users)[number]) => {
    setIssueSavingId(user.id);
    setPageError(null);
    try {
      await usersManagementService.issueMemberCard(user.id);
      await refetch();
      success(
        "Kartu Diterbitkan",
        `Kartu member untuk ${user.name} berhasil diterbitkan.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menerbitkan kartu member";
      setPageError(message);
      showErrorToast("Issue Kartu Gagal", message);
    } finally {
      setIssueSavingId(null);
    }
  };

  const handleRecordVisit = async (user: (typeof users)[number]) => {
    setRecordSavingId(user.id);
    try {
      await dashboardDataService.recordVisit({
        name: user.name || "User Tanpa Nama",
        identifier: user.cardNumber || user.email,
        email: user.email,
        faculty: "System User"
      });
      success("Kunjungan Dicatat", `${user.name} berhasil dicatat sebagai pengunjung hari ini.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mencatat kunjungan";
      showErrorToast("Gagal", message);
    } finally {
      setRecordSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
          Manajemen User
        </h2>
        <p className="text-slate-500 font-medium text-[15px] mt-1">
          Kelola dan monitor akun pengguna sistem perpustakaan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total User
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Super Admin
          </p>
          <p className="mt-2 text-2xl font-black text-red-700">
            {stats.admins}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Staff
          </p>
          <p className="mt-2 text-2xl font-black text-blue-700">
            {stats.staffs}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Banned
          </p>
          <p className="mt-2 text-2xl font-black text-orange-700">
            {stats.banned}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-[360px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama, email, atau role..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 outline-none"
            />
          </div>

          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-[#B91C1C] hover:bg-red-50 border border-slate-100 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              className="accent-sky-600"
              checked={showOnlyUnsynced}
              onChange={(e) => setShowOnlyUnsynced(e.target.checked)}
            />
            Tampilkan yang belum sinkron saja
          </label>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : pageError || usersError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-red-600">
              {pageError || usersError}
            </p>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Users2 size={42} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Tidak ada user ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      User
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Role
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Kartu
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Terdaftar
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-600 text-xs font-bold">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {user.name || "-"}
                            </p>
                            <p className="text-xs font-medium text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${roleBadgeClass(user.role)}`}
                        >
                          {user.role === "super_admin" ? (
                            <ShieldCheck size={12} className="mr-1.5" />
                          ) : null}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.banned ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border bg-orange-50 text-orange-700 border-orange-200">
                            <UserX size={12} className="mr-1.5" /> Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border bg-green-50 text-green-700 border-green-200">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${cardStatusClass(user.cardStatus)}`}
                          >
                            {cardStatusLabel(user.cardStatus)}
                          </span>
                          {user.cardNumber ? (
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              {user.cardNumber}
                            </span>
                          ) : null}
                        </div>
                        {user.cardRejectedReason ? (
                          <p className="max-w-[220px] text-[11px] text-rose-600">
                            {user.cardRejectedReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => void handleRecordVisit(user)}
                            disabled={recordSavingId === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            title="Catat Kunjungan Hari Ini"
                          >
                            <UserCheck size={12} />
                            {recordSavingId === user.id ? "..." : "Catat Kunjungan"}
                          </button>

                          <select
                            value={roleDraft[user.id] || user.role}
                            onChange={(e) =>
                              setRoleDraft((prev) => ({
                                ...prev,
                                [user.id]: e.target.value
                              }))
                            }
                            disabled={
                              user.id === currentUserId || savingId === user.id
                            }
                            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="student">student</option>
                            <option value="lecturer">lecturer</option>
                            <option value="staff">staff</option>
                            <option value="super_admin">super_admin</option>
                          </select>

                          <button
                            onClick={() => void handleUpdateRole(user)}
                            disabled={
                              user.id === currentUserId ||
                              savingId === user.id ||
                              (roleDraft[user.id] || user.role) === user.role
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#B91C1C] text-white hover:bg-[#991b1b] disabled:bg-slate-200 disabled:text-slate-400"
                          >
                            <Save size={12} />
                            {savingId === user.id ? "Menyimpan..." : "Simpan"}
                          </button>

                          <button
                            onClick={() => void handleToggleBan(user)}
                            disabled={
                              user.id === currentUserId || banSavingId === user.id
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 ${
                              user.banned
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                            }`}
                          >
                            <UserX size={12} />
                            {banSavingId === user.id
                              ? "Memproses..."
                              : user.banned
                                ? "Unban"
                                : "Ban"}
                          </button>

                          {!user.hasSyncedMember ? (
                            <button
                              onClick={() => void handleSyncMember(user)}
                              disabled={syncSavingId === user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                            >
                              <Link size={12} />
                              {syncSavingId === user.id
                                ? "Sync..."
                                : "Sync Member"}
                            </button>
                          ) : (
                            <>
                              <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                Sudah Sync
                              </span>
                              {user.cardStatus !== "active" ? (
                                <button
                                  onClick={() => void handleIssueCard(user)}
                                  disabled={issueSavingId === user.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#B91C1C] text-white hover:bg-[#991b1b] disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                  <ShieldCheck size={12} />
                                  {issueSavingId === user.id
                                    ? "Menerbitkan..."
                                    : "Terbitkan Kartu"}
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-medium">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}–
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} user
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
                        <Fragment key={p}>
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
                        </Fragment>
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
