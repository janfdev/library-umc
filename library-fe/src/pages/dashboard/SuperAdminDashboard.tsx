import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  Book,
  BookOpen,
  Home,
  LogOut,
  ScanLine,
  Search,
  Shield,
  Tag,
  Users,
  Wallet,
  BookMarked,
  CheckCircle
} from "lucide-react";

import Logo from "@/assets/logo_umc.png";
import AuditLogsSection from "@/components/dashboard/AuditLogsSection";
import CardApprovalsSection from "@/components/dashboard/CardApprovalsSection";
import CategoriesSection from "@/components/dashboard/CategoriesSection";
import CirculationSection from "@/components/dashboard/CirculationSection";
import CollectionsSection from "@/components/dashboard/CollectionsSection";
import DashboardSection from "@/components/dashboard/DashboardSection";
import FinesSection from "@/components/dashboard/FinesSection";
import GuestsSection from "@/components/dashboard/GuestsSection";
import LoansSection from "@/components/dashboard/LoansSection";
import ReportsSection from "@/components/dashboard/ReportsSection";
import UsersSection from "@/components/dashboard/UsersSection";
import RecommendationsSection from "@/components/dashboard/RecommendationsSection";
import ReturnApprovalsSection from "@/components/dashboard/ReturnApprovalsSection";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { useCategoriesData } from "@/hooks/dashboard/useCategoriesData";
import { useCollectionsData } from "@/hooks/dashboard/useCollectionsData";
import { useDashboardStatsLazy } from "@/hooks/dashboard/useDashboardStatsLazy";
import { useGuestsData } from "@/hooks/dashboard/useGuestsData";
import { cn } from "@/lib/utils";
import { dashboardDataService } from "@/services/dashboard/dashboardDataService";
import { authClient } from "@/utils/auth-client";

type ActiveMenu =
  | "dashboard"
  | "circulation"
  | "collections"
  | "guests"
  | "loans"
  | "categories"
  | "fines"
  | "cardApprovals"
  | "returnApprovals"
  | "users"
  | "audit"
  | "reports"
  | "recommendations";

type MenuConfig = {
  key: ActiveMenu;
  label: string;
  icon: typeof Home;
  superAdminOnly?: boolean;
};

const MENU_CONFIG: MenuConfig[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "circulation", label: "Sirkulasi & Scan", icon: ScanLine },
  { key: "collections", label: "Data Koleksi", icon: Book },
  { key: "guests", label: "Data Pengunjung", icon: Users },
  { key: "loans", label: "Peminjaman & Persetujuan", icon: BookOpen },
  { key: "returnApprovals", label: "Konfirmasi Pengembalian", icon: CheckCircle, superAdminOnly: true },
  { key: "categories", label: "Manajemen Kategori", icon: Tag },
  { key: "fines", label: "Manajemen Denda", icon: Wallet },
  { key: "cardApprovals", label: "Persetujuan Kartu", icon: Shield },
  { key: "users", label: "Manajemen User", icon: Users, superAdminOnly: true },
  { key: "audit", label: "Audit Log", icon: Shield, superAdminOnly: true },
  { key: "reports", label: "Laporan & Statistik", icon: BarChart3 },
  { key: "recommendations", label: "Rekomendasi Buku", icon: BookMarked }
];

const SIDEBAR_STORAGE_KEY = "umc-super-admin-sidebar-open";

type DashboardSidebarProps = {
  activeMenu: ActiveMenu;
  menus: MenuConfig[];
  onMenuChange: (menu: ActiveMenu) => void;
  onSignOut: () => Promise<void>;
};

function DashboardSidebar({
  activeMenu,
  menus,
  onMenuChange,
  onSignOut
}: DashboardSidebarProps) {
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-slate-800/40 z-100"
    >
      <SidebarHeader className="bg-[#0F172A] p-6 pb-4 group-data-[collapsible=icon]:px-8 group-data-[collapsible=icon]:pb-5">
        <div className="flex items-center gap-3 border-b border-slate-800/30 pb-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-b-0 group-data-[collapsible=icon]:pb-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B91C1C] p-1">
            <img
              src={Logo}
              alt="UMC Library Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-sm font-bold tracking-tight text-white">
              UMC Library
            </h1>
            <p className="text-[10px] text-slate-500">Digital Library System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#0F172A] px-3 py-2">
        <SidebarMenu className="space-y-1">
          {menus.map(({ key, label, icon: Icon }) => (
            <SidebarMenuItem key={key}>
              <SidebarMenuButton
                onClick={() => onMenuChange(key)}
                isActive={activeMenu === key}
                tooltip={label}
                className={cn(
                  "h-11 rounded-xl px-4 text-sm font-medium group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:rounded-full! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!",
                  activeMenu === key
                    ? "bg-white text-[#B91C1C] shadow-lg shadow-red-900/20"
                    : "text-white/90 hover:bg-[#B91C1C] hover:text-white"
                )}
              >
                <Icon className="size-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {label}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-[#0F172A] p-4 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => void onSignOut()}
              tooltip="Keluar"
              className="h-11 rounded-xl px-4 text-sm font-medium text-white/90 hover:bg-[#B91C1C] hover:text-white group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:rounded-full! group-data-[collapsible=icon]:px-0!"
            >
              <LogOut className="size-5" />
              <span className="group-data-[collapsible=icon]:hidden">
                Keluar
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function SuperAdminDashboard() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("dashboard");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved === null ? true : saved === "true";
  });

  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const visibleMenus = useMemo(
    () => MENU_CONFIG.filter((item) => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const isHotKey =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!isHotKey) return;

      event.preventDefault();
      setIsCommandOpen((open) => !open);
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats
  } = useDashboardStatsLazy(activeMenu === "dashboard");

  const {
    collections,
    loading: collectionsLoading,
    refetch: refetchCollections
  } = useCollectionsData(activeMenu === "collections");

  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories
  } = useCategoriesData(activeMenu === "categories");

  const {
    guests,
    members,
    loading: guestsLoading,
    refetch: refetchGuests
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
    guestsLoading
  ]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const handleSidebarOpenChange = (open: boolean) => {
    setSidebarOpen(open);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
    }
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
            members={members}
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
      case "cardApprovals":
        return <CardApprovalsSection />;
      case "users":
        if (!isSuperAdmin) {
          return (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
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
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
              <p className="text-sm font-bold text-red-600">
                Akses ditolak. Hanya super admin yang dapat membuka Audit Log.
              </p>
            </div>
          );
        }
        return <AuditLogsSection />;
      case "reports":
        return <ReportsSection />;
      case "returnApprovals":
        return <ReturnApprovalsSection />;
      case "recommendations":
        return <RecommendationsSection />;
      default:
        return <DashboardSection stats={stats} />;
    }
  };

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={handleSidebarOpenChange}
      style={
        {
          "--sidebar-width": "19rem",
          "--sidebar-width-icon": "3.75rem",
          "--header-height": "5rem"
        } as React.CSSProperties
      }
    >
      <DashboardSidebar
        activeMenu={activeMenu}
        menus={visibleMenus}
        onMenuChange={setActiveMenu}
        onSignOut={handleSignOut}
      />

      <SidebarInset className="bg-slate-100">
        <header className="sticky top-0 z-10 flex min-h-20 flex-wrap items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
          <SidebarTrigger className="size-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100" />

          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="flex min-w-55 flex-1 items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2.5 text-left text-sm text-slate-400 transition-all hover:bg-slate-200/70"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Cari menu dashboard...</span>
            <span className="hidden rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500 sm:inline-flex">
              Ctrl+K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4 sm:pl-6">
              <div className="hidden text-right sm:block">
                <p className="leading-tight text-sm font-bold text-slate-900">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Super Admin
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm">
                <span className="text-sm font-bold text-slate-500">
                  {session?.user?.name?.charAt(0) || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          {activeLoading ? (
            <div className="mx-auto max-w-7xl animate-in space-y-8 fade-in duration-500">
              <div className="mb-8 space-y-2 text-left">
                <Skeleton className="h-8 w-62.5 rounded-lg" />
                <Skeleton className="h-4 w-87.5 rounded-md" />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-30 rounded-[24px]" />
                <Skeleton className="h-30 rounded-[24px]" />
                <Skeleton className="h-30 rounded-[24px]" />
                <Skeleton className="h-30 rounded-[24px]" />
              </div>

              <Skeleton className="mt-8 h-100 w-full rounded-[32px]" />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm animate-in space-y-8 fade-in duration-500 delay-150 sm:p-5 lg:p-6">
              {renderSection()}
            </div>
          )}
        </div>

        <CommandDialog
          open={isCommandOpen}
          onOpenChange={setIsCommandOpen}
          title="Pencarian Dashboard"
          description="Cari dan pilih tab dashboard"
          className="border border-red-100 bg-white"
        >
          <CommandInput
            placeholder="Ketik nama menu dashboard..."
            className="placeholder:text-slate-400"
          />
          <CommandList>
            <CommandEmpty>Menu tidak ditemukan.</CommandEmpty>
            <CommandGroup
              heading="Menu Dashboard"
              className="**:[[cmdk-group-heading]]:text-red-600/80"
            >
              {visibleMenus.map(({ key, label, icon: Icon }) => (
                <CommandItem
                  key={key}
                  value={label}
                  className="data-[selected=true]:bg-red-600 data-[selected=true]:text-white"
                  onSelect={() => {
                    setActiveMenu(key);
                    setSearchTerm("");
                    setIsCommandOpen(false);
                  }}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                  <CommandShortcut className="text-red-500">
                    {activeMenu === key ? "Aktif" : ""}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
