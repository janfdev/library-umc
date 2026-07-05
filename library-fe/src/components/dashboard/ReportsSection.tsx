// src/components/dashboard/ReportsSection.tsx
import { useState, useEffect } from "react";
import {
  Users,
  BookCheck,
  DollarSign,
  TrendingUp,
  DownloadCloud,
  UploadCloud
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { API_BASE_URL } from "@/utils/api-config";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { analyzeReportCsv } from "@/utils/dashboardReportImport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRef } from "react";

interface ReportsSectionProps {
  className?: string;
}

interface PopularBookItem {
  id: string;
  title: string;
  loanCount: number;
}

interface GuestStatItem {
  date: string;
  count: number;
}

const dayLabels = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jum'at",
  "Sabtu"
];

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export default function ReportsSection({
  className = ""
}: ReportsSectionProps) {
  const { success, error, info } = useToast();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [chartRange, setChartRange] = useState<"day" | "week" | "month">("week");

  const [stats, setStats] = useState({
    totalVisitors: 0,
    successfulLoans: 0,
    totalPaidFines: 0,
    outstandingFines: 0,
    visitsPastWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; visits: number }[]>(
    []
  );
  const [popularBooks, setPopularBooks] = useState<PopularBookItem[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [
          guestsRes,
          loansRes,
          revenueSummaryRes,
          guestStatsRes,
          popularBooksRes
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/api/guests`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/loans?status=returned&limit=500`, {
            credentials: "include"
          }),
          fetch(
            `${API_BASE_URL}/api/reports/fines/revenue?month=${selectedMonth}&year=${selectedYear}`,
            { credentials: "include" }
          ),
          fetch(`${API_BASE_URL}/api/reports/guest-stats?range=${chartRange}`, {
            credentials: "include"
          }),
          fetch(`${API_BASE_URL}/api/reports/popular-books?limit=5`, {
            credentials: "include"
          })
        ]);

        const [
          guestsData,
          loansData,
          revenueSummaryData,
          guestStatsData,
          popularBooksData
        ] = await Promise.all([
          guestsRes.json(),
          loansRes.json(),
          revenueSummaryRes.json(),
          guestStatsRes.json(),
          popularBooksRes.json()
        ]);

        let guestsCount = 0;
        let visitsPastWeek = 0;
        let loansCount = 0;
        let finesRevenue = 0;
        let outstandingFines = 0;

        if (guestsData.success && Array.isArray(guestsData.data)) {
          guestsCount = guestsData.data.length;
        }

        if (loansData.success && Array.isArray(loansData.data)) {
          loansCount = loansData.data.length;
        }

        if (guestStatsData.success && Array.isArray(guestStatsData.data)) {
          const source = guestStatsData.data as GuestStatItem[];
          const mapByDate = new Map<string, number>();
          source.forEach((row) => {
            mapByDate.set(row.date, Number(row.count) || 0);
          });

          if (chartRange === "day") {
            const hourly = Array.from({ length: 24 }, (_, h) => {
              const label = `${String(h).padStart(2, "0")}:00`;
              const count = mapByDate.get(label) ?? 0;
              visitsPastWeek += count;
              return { day: label, visits: count };
            });
            setChartData(hourly);
          } else if (chartRange === "month") {
            const last30Days = Array.from({ length: 30 }, (_, index) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - index));
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const key = `${yyyy}-${mm}-${dd}`;
              const count = mapByDate.get(key) ?? 0;
              visitsPastWeek += count;
              return {
                day: `${d.getDate()} ${monthLabels[d.getMonth()]}`,
                visits: count
              };
            });
            setChartData(last30Days);
          } else {
            const last7Days = Array.from({ length: 7 }, (_, index) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - index));
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const key = `${yyyy}-${mm}-${dd}`;
              const count = mapByDate.get(key) ?? 0;
              visitsPastWeek += count;
              return {
                day: dayLabels[d.getDay()],
                visits: count
              };
            });
            setChartData(last7Days);
          }
        } else {
          const fallbackLength = chartRange === "day" ? 24 : chartRange === "month" ? 30 : 7;
          setChartData(
            Array.from({ length: fallbackLength }, (_, index) => {
              if (chartRange === "day") {
                return { day: `${String(index).padStart(2, "0")}:00`, visits: 0 };
              }
              const d = new Date();
              d.setDate(d.getDate() - (fallbackLength - 1 - index));
              return {
                day: chartRange === "month"
                  ? `${d.getDate()} ${monthLabels[d.getMonth()]}`
                  : dayLabels[d.getDay()],
                visits: 0
              };
            })
          );
        }

        if (popularBooksData.success && Array.isArray(popularBooksData.data)) {
          setPopularBooks(
            popularBooksData.data.map(
              (book: {
                id: string;
                title: string;
                loanCount: number | string;
              }) => ({
                id: book.id,
                title: book.title,
                loanCount: Number(book.loanCount) || 0
              })
            )
          );
        } else {
          setPopularBooks([]);
        }

        if (revenueSummaryData.success && revenueSummaryData.data) {
          finesRevenue = Number(revenueSummaryData.data.totalFineRevenue || 0);
          outstandingFines = Number(
            revenueSummaryData.data.outstandingFines || 0
          );
        }

        setStats({
          totalVisitors: guestsCount,
          successfulLoans: loansCount,
          totalPaidFines: finesRevenue,
          outstandingFines,
          visitsPastWeek
        });
      } catch (error) {
        console.error("Gagal mengambil data reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedMonth, selectedYear, chartRange]);

  const monthOptions = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ];

  const yearOptions = Array.from(
    { length: 5 },
    (_, index) => now.getFullYear() - index
  );

  const selectedMonthLabel =
    monthOptions.find((month) => month.value === selectedMonth)?.label ?? "-";

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportReport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      error(
        "Format tidak didukung",
        "Gunakan file laporan CSV dari menu export."
      );
      event.target.value = "";
      return;
    }

    try {
      const raw = await file.text();
      const summary = analyzeReportCsv(raw);

      if (!summary) {
        error("Import gagal", "Isi file kosong atau format CSV tidak valid.");
        event.target.value = "";
        return;
      }

      setStats((previous) => ({
        ...previous,
        successfulLoans:
          summary.successfulLoans > 0
            ? summary.successfulLoans
            : previous.successfulLoans,
        totalPaidFines:
          summary.totalPaidFines > 0
            ? summary.totalPaidFines
            : previous.totalPaidFines,
        outstandingFines:
          summary.outstandingFines > 0
            ? summary.outstandingFines
            : previous.outstandingFines
      }));

      if (summary.popularBooks.length > 0) {
        setPopularBooks(
          summary.popularBooks.map((book, index) => ({
            id: `imported-${index}-${book.title}`,
            title: book.title,
            loanCount: book.loanCount
          }))
        );
      }

      success(
        "Import laporan berhasil",
        `Data dari ${file.name} sudah diterapkan ke dashboard.`
      );
      info(
        "Mode data lokal aktif",
        "Refresh halaman untuk kembali ke data realtime API."
      );
    } catch (importError) {
      console.error("Gagal import laporan:", importError);
      error("Import gagal", "Terjadi kesalahan saat membaca file laporan CSV.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
            Laporan & Statistik
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Metrik dan performa perpustakaan (Data Realtime API).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportReport}
          />
          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-2 bg-card text-[#0F172A] px-5 py-2.5 rounded-xl font-bold text-sm border border-border hover:bg-surface-hover transition-colors shadow-sm"
          >
            <UploadCloud size={18} />
            Import Laporan
          </button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-800 transition-colors shadow-sm shadow-red-500/20">
                <DownloadCloud size={18} />
                Export Laporan
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-2 rounded-2xl shadow-xl border-border bg-card"
            >
              <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Format Laporan (PDF)
              </div>
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/api/reports/loans/export?format=pdf`,
                    "_blank"
                  )
                }
                className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-muted-foreground focus:bg-muted focus:text-[#B91C1C]"
              >
                Laporan Peminjaman
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/api/reports/fines/export?format=pdf`,
                    "_blank"
                  )
                }
                className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-muted-foreground focus:bg-muted focus:text-[#B91C1C]"
              >
                Laporan Denda
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/api/reports/fines/export?format=pdf&status=paid&month=${selectedMonth}&year=${selectedYear}`,
                    "_blank"
                  )
                }
                className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-muted-foreground focus:bg-muted focus:text-[#B91C1C]"
              >
                Pendapatan Denda Bulanan
              </DropdownMenuItem>

              <div className="h-px bg-muted my-1 mx-2" />

              <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Format Excel (CSV)
              </div>
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/api/reports/loans/export?format=csv`,
                    "_blank"
                  )
                }
                className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-muted-foreground focus:bg-muted focus:text-[#1D4ED8]"
              >
                Laporan Peminjaman
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/api/reports/fines/export?format=csv`,
                    "_blank"
                  )
                }
                className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-muted-foreground focus:bg-muted focus:text-[#1D4ED8]"
              >
                Laporan Denda
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/api/reports/fines/export?format=csv&status=paid&month=${selectedMonth}&year=${selectedYear}`,
                    "_blank"
                  )
                }
                className="px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-muted-foreground focus:bg-muted focus:text-[#1D4ED8]"
              >
                Pendapatan Denda Bulanan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Periode Audit Pendapatan
        </p>
        <select
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(Number(event.target.value))}
          className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground"
        >
          {monthOptions.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(event) => setSelectedYear(Number(event.target.value))}
          className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Pengunjung */}
        <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-full bg-[#EBF5FF] flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-[#2563EB]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              TOTAL PENGUNJUNG
            </p>
            <p className="text-3xl font-black text-foreground mt-2">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats.totalVisitors
              )}
            </p>
          </div>
        </div>

        {/* Peminjaman Sukses */}
        <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <BookCheck className="w-7 h-7 text-[#059669]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              PEMINJAMAN SUKSES
            </p>
            <p className="text-3xl font-black text-foreground mt-2">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats.successfulLoans
              )}
            </p>
          </div>
        </div>

        {/* Denda Terkumpul */}
        <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7 text-[#DC2626]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              PENDAPATAN DENDA ({selectedMonthLabel.toUpperCase()}{" "}
              {selectedYear})
            </p>
            <p className="text-3xl font-black text-foreground mt-2">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `Rp ${stats.totalPaidFines.toLocaleString("id-ID")}`
              )}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-2">
              Tagihan aktif: Rp {stats.outstandingFines.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Lists Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 bg-card p-8 rounded-[24px] border border-border shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-[15px] font-extrabold text-[#0F172A]">
              Grafik Kunjungan
            </h3>
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {(["day", "week", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    chartRange === range
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-muted-foreground"
                  }`}
                >
                  {range === "day" ? "Hari" : range === "week" ? "Minggu" : "Bulan"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full h-[300px] mb-6">
            <ResponsiveContainer
              width="100%"
              height={300}
              minWidth={1}
              minHeight={1}
            >
              <BarChart
                key={chartRange}
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                barSize={chartRange === "week" ? 50 : chartRange === "day" ? 14 : 16}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                    fontWeight: 600
                  }}
                  formatter={(value: any) => [`${value} pengunjung`, "Kunjungan"]}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#0F172A", fontSize: 12, fontWeight: 700 }}
                  tickMargin={15}
                  height={40}
                  interval={chartRange === "month" ? 4 : chartRange === "day" ? 2 : 0}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                  width={35}
                />

                <Bar
                  dataKey="visits"
                  fill="#9a1b1b"
                  radius={[4, 4, 0, 0]}
                  background={{ fill: "#F1F5F9", radius: 4 }}
                  name="Kunjungan"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t-2 border-border pt-5">
            <p className="text-center text-sm font-bold text-[#64748B]">
              Total : {stats.visitsPastWeek} pengunjung{" "}
              {chartRange === "day" ? "hari ini" : chartRange === "month" ? "bulan ini" : "minggu ini"}
            </p>
          </div>
        </div>

        {/* Popular Books Section */}
        <div className="bg-card p-8 rounded-[24px] border border-border shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-extrabold text-[#0F172A]">
              Buku Terpopuler
            </h3>
            <TrendingUp className="w-5 h-5 text-foreground" strokeWidth={3} />
          </div>

          <div className="space-y-6 flex-1">
            {popularBooks.length === 0 && !loading ? (
              <p className="text-sm font-semibold text-muted-foreground">
                Belum ada data peminjaman buku.
              </p>
            ) : null}
            {popularBooks.map((book, index) => (
              <div key={book.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm font-bold text-[#0F172A] truncate max-w-[120px]">
                    {book.title}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#EBF5FF] text-[#2563EB] text-[10px] font-black tracking-wide shrink-0">
                  {book.loanCount} Dipinjam
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
