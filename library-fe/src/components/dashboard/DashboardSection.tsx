import {
  Book,
  Users,
  Clock,
  Wallet,
  User as UserIcon,
  DownloadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/utils/api-config";
import loanService, { type Loan } from "@/services/loanService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardSectionProps {
  stats: {
    totalCollections: number;
    totalCategories: number;
    totalGuests: number;
    activeBorrowings?: number;
    outstandingFines?: number;
    totalFineRevenue?: number;
  };
}

export default function DashboardSection({ stats }: DashboardSectionProps) {
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [loanLoading, setLoanLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRecentLoans = async () => {
      setLoanLoading(true);
      try {
        const loans = await loanService.getAllLoans();
        if (!isMounted) return;

        const sorted = [...loans].sort((a, b) => {
          const da = new Date(a.createdAt || a.loanDate || 0).getTime();
          const db = new Date(b.createdAt || b.loanDate || 0).getTime();
          return db - da;
        });

        setRecentLoans(sorted.slice(0, 5));
      } catch {
        if (isMounted) {
          setRecentLoans([]);
        }
      } finally {
        if (isMounted) {
          setLoanLoading(false);
        }
      }
    };

    void loadRecentLoans();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedRecentLoans = useMemo(
    () =>
      recentLoans.map((loan) => {
        const memberName =
          loan.memberName ||
          (loan.member?.user as { name?: string } | undefined)?.name ||
          "Member";
        const bookTitle =
          loan.collectionTitle || loan.item?.collection?.title || "Buku";
        const createdAt = loan.createdAt || loan.loanDate;

        return {
          id: loan.id,
          memberName,
          bookTitle,
          status: loan.status,
          timeText: createdAt
            ? new Date(createdAt).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
        };
      }),
    [recentLoans],
  );

  const statusMeta: Record<string, { label: string; className: string }> = {
    approved: {
      label: "Dipinjam",
      className: "bg-[#fff7ed] text-[#ea580c]",
    },
    pending: {
      label: "Menunggu",
      className: "bg-[#eff6ff] text-[#2563eb]",
    },
    returned: {
      label: "Dikembalikan",
      className: "bg-[#ecfdf5] text-[#059669]",
    },
    rejected: {
      label: "Ditolak",
      className: "bg-[#fef2f2] text-[#dc2626]",
    },
  };

  const statCards = [
    {
      label: "Total Koleksi",
      value: stats.totalCollections,
      icon: <Book />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Sedang Dipinjam",
      value: stats.activeBorrowings ?? 0,
      icon: <Clock />,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Anggota Aktif",
      value: stats.totalGuests,
      icon: <Users />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Tagihan Denda Aktif",
      value: `Rp ${(stats.outstandingFines ?? 0).toLocaleString("id-ID")}`,
      icon: <Wallet />,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Pendapatan Denda",
      value: `Rp ${(stats.totalFineRevenue ?? 0).toLocaleString("id-ID")}`,
      icon: <Wallet />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Ringkasan */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Ringkasan Sistem
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Pantau aktivitas perpustakaan hari ini.
          </p>
        </div>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-800 transition-colors shadow-sm shadow-red-900/20">
              <DownloadCloud size={18} />
              Export Laporan
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-2xl shadow-xl border-slate-100 bg-white"
          >
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Format Laporan (PDF)
            </div>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  `${API_BASE_URL}/api/reports/loans/export?format=pdf`,
                  "_blank",
                )
              }
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#B91C1C]"
            >
              Laporan Peminjaman
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  `${API_BASE_URL}/api/reports/fines/export?format=pdf`,
                  "_blank",
                )
              }
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#B91C1C]"
            >
              Laporan Denda
            </DropdownMenuItem>

            <div className="h-px bg-slate-100 my-1 mx-2" />

            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Format Excel (CSV)
            </div>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  `${API_BASE_URL}/api/reports/loans/export?format=csv`,
                  "_blank",
                )
              }
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#1D4ED8]"
            >
              Laporan Peminjaman
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  `${API_BASE_URL}/api/reports/fines/export?format=csv`,
                  "_blank",
                )
              }
              className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#1D4ED8]"
            >
              Laporan Denda
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all"
          >
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stat.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Aktivitas Peminjaman Terbaru */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 md:px-8 md:py-6 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
            Aktivitas Peminjaman Terbaru
          </h3>
          <button className="text-[#B91C1C] font-bold text-sm hover:underline flex items-center gap-1 group">
            Lihat Semua{" "}
            <span className="text-lg group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
        </div>

        <div className="p-4 md:p-6 flex flex-col">
          {loanLoading ? (
            <div className="p-4 px-6 text-sm text-slate-400 font-semibold">
              Memuat aktivitas peminjaman...
            </div>
          ) : formattedRecentLoans.length === 0 ? (
            <div className="p-4 px-6 text-sm text-slate-400 font-semibold">
              Belum ada aktivitas peminjaman terbaru.
            </div>
          ) : (
            formattedRecentLoans.map((loan) => {
              const meta = statusMeta[loan.status] || {
                label: loan.status,
                className: "bg-slate-100 text-slate-600",
              };

              return (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center text-[#94A3B8]">
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900">
                        {loan.memberName}{" "}
                        <span className="font-normal text-slate-400 mx-0.5">
                          meminjam
                        </span>{" "}
                        {loan.bookTitle}
                      </p>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                        {loan.timeText}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
