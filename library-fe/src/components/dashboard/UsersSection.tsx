import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Users2,
  ShieldCheck,
  UserX,
  Save,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/utils/auth-client";
import Notification from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { useUsersManagement } from "@/hooks/dashboard/useUsersManagement";
import { usersManagementService } from "@/services/dashboard/usersManagementService";

export default function UsersSection() {
  const { data: session } = authClient.useSession();
  const {
    notifications,
    success,
    error: showErrorToast,
    warning,
    removeToast,
  } = useToast();

  const {
    users,
    loading,
    error: usersError,
    stats,
    refetch,
  } = useUsersManagement(true);

  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [banSavingId, setBanSavingId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});

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
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, search]);

  const roleBadgeClass = (role: string) => {
    if (role === "super_admin") return "bg-red-50 text-red-700 border-red-200";
    if (role === "staff") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const handleUpdateRole = async (user: (typeof users)[number]) => {
    const nextRole = roleDraft[user.id] || user.role;
    if (!nextRole || nextRole === user.role) {
      warning(
        "Tidak Ada Perubahan",
        "Role yang dipilih sama dengan role saat ini.",
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
        `Role ${user.name} berhasil diubah menjadi ${nextRole}.`,
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
        "Pelanggaran kebijakan sistem",
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
        banReason,
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
              onChange={(e) => setSearch(e.target.value)}
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
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Users2 size={42} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Tidak ada user ditemukan</p>
          </div>
        ) : (
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
                    Terdaftar
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
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
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={roleDraft[user.id] || user.role}
                          onChange={(e) =>
                            setRoleDraft((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {notifications.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Notification {...t} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
