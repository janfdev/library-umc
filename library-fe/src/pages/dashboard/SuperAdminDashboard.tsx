import { useMemo, useState } from "react";
import { authClient } from "@/utils/auth-client";
import { useNavigate } from "react-router";
import Logo from "@/assets/logo_umc.png";

import { Skeleton } from "@/components/ui/skeleton";
import DashboardSection from "@/components/dashboard/DashboardSection";
import CollectionsSection from "@/components/dashboard/CollectionsSection";
import CategoriesSection from "@/components/dashboard/CategoriesSection";
import GuestsSection from "@/components/dashboard/GuestsSection";
import ReportsSection from "@/components/dashboard/ReportsSection";
import LoansSection from "@/components/dashboard/LoansSection";
import CirculationSection from "@/components/dashboard/CirculationSection";
import FinesSection from "@/components/dashboard/FinesSection";
import UsersSection from "@/components/dashboard/UsersSection";
import AuditLogsSection from "@/components/dashboard/AuditLogsSection";

import {
  Book,
  BookOpen,
  Users,
  Search,
  LogOut,
  Home,
  ScanLine,
  Tag,
  BarChart3,
  Bell,
  Wallet,
  Shield,
} from "lucide-react";

import { dashboardDataService } from "@/services/dashboard/dashboardDataService";
import { useCollectionsData } from "@/hooks/dashboard/useCollectionsData";
import { useCategoriesData } from "@/hooks/dashboard/useCategoriesData";
import { useGuestsData } from "@/hooks/dashboard/useGuestsData";
import { useDashboardStatsLazy } from "@/hooks/dashboard/useDashboardStatsLazy";

type ActiveMenu =
  | "dashboard"
  | "collections"
  | "categories"
  | "guests"
  | "reports"
  | "loans"
  | "circulation"
  | "fines"
  | "users"
  | "audit";

export default function SuperAdminDashboard() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("dashboard");

  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStatsLazy(activeMenu === "dashboard");

  const {
    collections,
    loading: collectionsLoading,
    refetch: refetchCollections,
  } = useCollectionsData(activeMenu === "collections");

  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategoriesData(activeMenu === "categories");

  const {
    guests,
    loading: guestsLoading,
    refetch: refetchGuests,
  } = useGuestsData(activeMenu === "guests");

  const activeLoading = useMemo(() => {
    if (activeMenu === "dashboard") return statsLoading;
    if (activeMenu === "collections") return collectionsLoading;
    if (activeMenu === "categories") return categoriesLoading;
    if (activeMenu === "guests") return guestsLoading;
    return false;
  }, [
    activeMenu,
    statsLoading,
    collectionsLoading,
    categoriesLoading,
    guestsLoading,
  ]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      await dashboardDataService.deleteCategory(id);
      await Promise.all([refetchCategories(), refetchStats()]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCollection = async (id: string, title: string) => {
    if (!confirm(`Hapus koleksi "${title}"?`)) return;
    try {
      await dashboardDataService.deleteCollection(id);
      await Promise.all([refetchCollections(), refetchStats()]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Hapus log pengunjung "${name}"?`)) return;
    try {
      await dashboardDataService.deleteGuest(id);
      await Promise.all([refetchGuests(), refetchStats()]);
    } catch (error) {
      console.error(error);
    }
  };

  const renderSection = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardSection stats={stats} />;

      case "collections":
        return (
          <CollectionsSection
            collections={collections}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onDelete={handleDeleteCollection}
            onRefresh={() =>
              void Promise.all([refetchCollections(), refetchStats()])
            }
          />
        );

      case "categories":
        return (
          <CategoriesSection
            categories={categories}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onDelete={handleDeleteCategory}
            onRefresh={() =>
              void Promise.all([refetchCategories(), refetchStats()])
            }
          />
        );

      case "guests":
        return (
          <GuestsSection
            guests={guests}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onDelete={handleDeleteGuest}
            onRefresh={() =>
              void Promise.all([refetchGuests(), refetchStats()])
            }
          />
        );

      case "loans":
        return (
          <LoansSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        );

      case "circulation":
        return <CirculationSection />;

      case "fines":
        return <FinesSection />;

      case "users":
        if (!isSuperAdmin) {
          return (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm font-bold text-red-600">
                Akses ditolak. Hanya super admin yang dapat membuka Manajemen
                User.
              </p>
            </div>
          );
        }
        return <UsersSection />;

      case "audit":
        if (!isSuperAdmin) {
          return (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm font-bold text-red-600">
                Akses ditolak. Hanya super admin yang dapat membuka Audit Log.
              </p>
            </div>
          );
        }
        return <AuditLogsSection />;

      case "reports":
        return <ReportsSection />;

      default:
        return <DashboardSection stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      <aside className="w-[280px] bg-[#0F172A] hidden lg:flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 mb-4 flex items-center gap-3 border-b border-slate-800/30">
          <div className="w-12 h-12 bg-[#B91C1C] rounded-full flex items-center justify-center">
            <img
              src={Logo}
              alt="UMC Library Logo"
              className="w-10 h-10 rounded-full"
            />
          </div>
          <div>
            <h1 className="text-white text-sm font-bold tracking-tight">
              UMC Library
            </h1>
            <p className="text-slate-500 text-[10px]">Digital Library System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "dashboard"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Home size={18} /> Dashboard
          </button>

          <div className="py-4 px-4">
            <div className="h-px bg-slate-800/50 w-full" />
          </div>

          <button
            onClick={() => setActiveMenu("circulation")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "circulation"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <ScanLine size={18} /> Sirkulasi & Scan
          </button>

          <button
            onClick={() => setActiveMenu("collections")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "collections"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Book size={18} /> Data Koleksi
          </button>

          <button
            onClick={() => setActiveMenu("guests")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "guests"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users size={18} /> Data Pengunjung
          </button>

          <button
            onClick={() => setActiveMenu("loans")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "loans"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BookOpen size={18} /> Peminjaman & Persetujuan
          </button>

          <button
            onClick={() => setActiveMenu("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "categories"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Tag size={18} /> Manajemen Kategori
          </button>

          <button
            onClick={() => setActiveMenu("fines")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "fines"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Wallet size={18} /> Manajemen Denda
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveMenu("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeMenu === "users"
                  ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Users size={18} /> Manajemen User
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setActiveMenu("audit")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeMenu === "audit"
                  ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Shield size={18} /> Audit Log
            </button>
          )}

          <button
            onClick={() => setActiveMenu("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === "reports"
                ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BarChart3 size={18} /> Laporan & Statistik
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 transition-all"
          >
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pencarian cepat..."
                className="w-full md:w-[400px] pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-red-500/10 transition-all focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Super Admin
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <span className="text-sm font-bold text-slate-500">
                  {session?.user?.name?.charAt(0) || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          {activeLoading ? (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2 mb-8 text-left">
                <Skeleton className="h-8 w-[250px] rounded-lg" />
                <Skeleton className="h-4 w-[350px] rounded-md" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-[120px] rounded-[24px]" />
                <Skeleton className="h-[120px] rounded-[24px]" />
                <Skeleton className="h-[120px] rounded-[24px]" />
                <Skeleton className="h-[120px] rounded-[24px]" />
              </div>

              <Skeleton className="h-[400px] w-full rounded-[32px] mt-8" />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 delay-150">
              {renderSection()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
