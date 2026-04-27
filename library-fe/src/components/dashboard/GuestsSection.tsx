import { useState, Fragment, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  UserCheck,
  Loader,
  X
} from "lucide-react";
import { dashboardDataService } from "@/services/dashboard/dashboardDataService";
import { useToast } from "@/hooks/useToast";
import AddMemberModal from "./AddMemberModal";

interface GuestLog {
  id: string;
  name: string;
  email: string;
  identifier: string;
  faculty: string;
  major: string;
  visitDate: string;
  createdAt?: string;
}

interface GuestsSectionProps {
  guests: GuestLog[];
  members: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string, name: string) => void;
  onRefresh: () => void;
}

export default function GuestsSection({
  guests,
  members,
  searchTerm,
  onSearchChange,
  onRefresh
}: GuestsSectionProps) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"anggota" | "tamu">("anggota");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  // Dropdown state for picking a member to record as guest (tab buku tamu)
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberDropdownQuery, setMemberDropdownQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;
  const { success, error: showErrorToast } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMemberDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMemberDropdownOpen(false);
        setMemberDropdownQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMemberDropdownOpen]);

  const filteredGuests = guests.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.faculty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(
    (item) =>
      (item.user?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.nimNidn || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.memberType || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeList = activeTab === "anggota" ? filteredMembers : filteredGuests;
  const totalPages = Math.max(1, Math.ceil(activeList.length / itemsPerPage));
  const paginatedList = activeList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTabChange = (tab: "anggota" | "tamu") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setCurrentPage(1);
  };

  // Catat kehadiran dari dropdown di tab "Buku Tamu"
  const handleQuickRecordFromDropdown = async (member: any) => {
    setIsMemberDropdownOpen(false);
    setMemberDropdownQuery("");
    setRecordingId(member.id);
    try {
      await dashboardDataService.recordVisit({
        name: member.user?.name || "Unknown",
        email: member.user?.email || "",
        identifier: member.nimNidn || "UNKNOWN",
        faculty: member.faculty || "Not Specified",
        major: "Not Specified"
      });
      success(
        "Kehadiran Dicatat",
        `${member.user?.name || "Pengunjung"} berhasil dicatat.`
      );
      onRefresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mencatat kehadiran";
      showErrorToast("Gagal", message);
    } finally {
      setRecordingId(null);
    }
  };

  const filteredDropdownMembers = members.filter((m) => {
    const q = memberDropdownQuery.toLowerCase();
    return (
      (m.user?.name || "").toLowerCase().includes(q) ||
      (m.nimNidn || "").toLowerCase().includes(q)
    );
  });

  // Helper function to format date
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const isToday = new Date().toDateString() === date.toDateString();
      const time = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      });

      if (isToday) {
        return `Hari ini, ${time}`;
      }
      return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${time}`;
    } catch {
      return "Waktu tidak diketahui";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
            Manajemen Pengguna
          </h2>
          <p className="text-slate-500 font-medium text-[15px] mt-1">
            Kelola data keanggotaan dan riwayat pengunjung perpustakaan.
          </p>
        </div>

        {activeTab === "anggota" ? (
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="bg-[#B91C1C] hover:bg-[#9a1b1b] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Anggota
          </button>
        ) : (
          // Dropdown: pick an existing member to record as guest instantly
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMemberDropdownOpen((v) => !v)}
              className="bg-[#B91C1C] hover:bg-[#9a1b1b] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
            >
              <UserCheck size={18} strokeWidth={2.5} />
              Catat Pengunjung
              <ChevronDown
                size={15}
                className={`transition-transform ${isMemberDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMemberDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Dropdown Header */}
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Pilih Anggota
                    </p>
                    <button
                      onClick={() => {
                        setIsMemberDropdownOpen(false);
                        setMemberDropdownQuery("");
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Cari nama / NIM..."
                      value={memberDropdownQuery}
                      onChange={(e) => setMemberDropdownQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Member list */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 pb-2">
                  {filteredDropdownMembers.length === 0 ? (
                    <p className="px-4 py-5 text-center text-xs text-slate-400">
                      Tidak ada anggota ditemukan
                    </p>
                  ) : (
                    filteredDropdownMembers.map((member) => (
                      <button
                        key={member.id}
                        disabled={recordingId === member.id}
                        onClick={() =>
                          void handleQuickRecordFromDropdown(member)
                        }
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left group disabled:opacity-50 disabled:cursor-wait"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          {member.user?.image ? (
                            <img
                              src={member.user.image}
                              alt={member.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users size={16} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#B91C1C] truncate transition-colors">
                            {member.user?.name || "No Name"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {member.nimNidn || "-"} ·{" "}
                            {member.memberType?.replace("_", " ") || "student"}
                          </p>
                        </div>
                        {recordingId === member.id ? (
                          <Loader
                            size={14}
                            className="animate-spin text-[#B91C1C] shrink-0"
                          />
                        ) : (
                          <UserCheck
                            size={14}
                            className="text-slate-300 group-hover:text-[#B91C1C] shrink-0 transition-colors"
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Layout matching new designs: pills instead of bottom border */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => handleTabChange("anggota")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeTab === "anggota"
              ? "bg-white border-red-200 text-[#B91C1C] shadow-sm ring-1 ring-[#B91C1C]/10"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Daftar Anggota Aktif
        </button>
        <button
          onClick={() => handleTabChange("tamu")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeTab === "tamu"
              ? "bg-white border-red-200 text-[#B91C1C] shadow-sm ring-1 ring-[#B91C1C]/10"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Buku Tamu (Pengunjung)
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
              placeholder={
                activeTab === "anggota"
                  ? "Cari NIM, Nama..."
                  : "Cari Nama, Fakultas..."
              }
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/10 focus:border-[#B91C1C]/40 transition-all outline-none placeholder:text-slate-400"
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
                {activeTab === "tamu" ? (
                  <>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      WAKTU KEDATANGAN
                    </th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      NAMA PENGUNJUNG
                    </th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      FAKULTAS
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      INFORMASI ANGGOTA
                    </th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      TIPE AKUN
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTab === "tamu" ? (
                // BUKU TAMU RENDER
                paginatedList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-8 py-12 text-center text-slate-400"
                    >
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-semibold">
                        Tidak ada data pengunjung ditemukan
                      </p>
                    </td>
                  </tr>
                ) : (
                  (paginatedList as GuestLog[]).map((guest) => (
                    <tr
                      key={guest.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-400">
                          {formatDate(
                            guest.visitDate ||
                              guest.createdAt ||
                              new Date().toISOString()
                          )}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors">
                            {guest.name}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">
                            {guest.identifier || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[13px] font-medium text-slate-400">
                          {guest.major || "Umum"}
                        </p>
                      </td>
                    </tr>
                  ))
                )
              ) : // DAFTAR ANGGOTA RENDER — view only
              paginatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-8 py-12 text-center text-slate-400"
                  >
                    <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-semibold">
                      Tidak ada data anggota ditemukan
                    </p>
                  </td>
                </tr>
              ) : (
                (paginatedList as any[]).map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
                          {member.user?.image ? (
                            <img
                              src={member.user.image}
                              alt={member.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#B91C1C] transition-colors">
                            {member.user?.name || "No Name"}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">
                            {member.nimNidn || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[13px] font-bold text-slate-500 capitalize">
                        {member.memberType?.replace("_", " ") || "student"}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">
                        {member.major || "-"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-medium">
              Menampilkan{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                activeList.length
              )}
              –{Math.min(currentPage * itemsPerPage, activeList.length)} dari{" "}
              {activeList.length} data
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
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
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onRefresh={onRefresh}
      />
    </div>
  );
}
