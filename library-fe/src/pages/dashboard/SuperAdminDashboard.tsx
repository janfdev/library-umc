// src/pages/SuperAdminDashboard.tsx
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import Logo from "@/assets/logo_umc.png";

// Import komponen section
import DashboardSection from "@/components/dashboard/DashboardSection";
import CollectionsSection from "@/components/dashboard/CollectionsSection";
import CategoriesSection from "@/components/dashboard/CategoriesSection";
import GuestsSection from "@/components/dashboard/GuestsSection";
import ReportsSection from "@/components/dashboard/ReportsSection";

// Import icons untuk sidebar
import {
  Book,
  Users,
  Search,
  LogOut,
  LayoutDashboard,
  Bell,
  ScanLine,
  Tag,
  BarChart3,
  Home
} from "lucide-react";

import { API_BASE_URL } from "@/lib/api-config";

// Types
interface Collection {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  type: string;
  category: {
    name: string;
  };
  image: string | null;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

interface GuestLog {
  id: string;
  name: string;
  email: string;
  identifier: string;
  faculty: string;
  major: string;
  visitDate: string;
}

interface Stats {
  totalCollections: number;
  totalCategories: number;
  totalGuests: number;
  activeBorrowings?: number;
  totalFines?: number;
}

export default function SuperAdminDashboard() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  
  // State untuk data
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [guests, setGuests] = useState<GuestLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCollections: 0,
    totalCategories: 0,
    totalGuests: 0,
    activeBorrowings: 346,
    totalFines: 50000,
  });
  
  // State untuk UI
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState<
    "dashboard" | "collections" | "categories" | "guests" | "reports"
  >("dashboard");
  const [loading, setLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const collectionsRes = await fetch(`${API_BASE_URL}/api/collections`);
      const collectionsData = await collectionsRes.json();
      const collectionsList = collectionsData.success ? collectionsData.data : [];
      setCollections(collectionsList);

      const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`);
      const categoriesData = await categoriesRes.json();
      const categoriesList = categoriesData.success ? categoriesData.data : [];
      setCategories(categoriesList);

      let guestsList: GuestLog[] = [];
      try {
        const guestsRes = await fetch(`${API_BASE_URL}/api/guests`, {
          credentials: "include",
        });
        const guestsData = await guestsRes.json();
        if (guestsData.success && Array.isArray(guestsData.data)) {
          guestsList = guestsData.data;
          setGuests(guestsList);
        }
      } catch (guestError) {
        console.error("Failed to fetch guest logs:", guestError);
      }

      setStats({
        totalCollections: collectionsList.length,
        totalCategories: categoriesList.length,
        totalGuests: guestsList.length,
        activeBorrowings: 346,
        totalFines: 50000,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  // Handler untuk delete
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { 
        method: "DELETE", 
        credentials: "include" 
      });
      if ((await res.json()).success) fetchData();
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleDeleteCollection = async (id: string, title: string) => {
    if (!confirm(`Hapus koleksi "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/collections/${id}`, { 
        method: "DELETE", 
        credentials: "include" 
      });
      if ((await res.json()).success) fetchData();
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Hapus log pengunjung "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/guests/${id}`, { 
        method: "DELETE", 
        credentials: "include" 
      });
      if ((await res.json()).success) fetchData();
    } catch (error) { 
      console.error(error); 
    }
  };

  // Render section berdasarkan activeMenu
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
            onRefresh={fetchData}
          />
        );
      
      case "categories":
        return (
          <CategoriesSection 
            categories={categories}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onDelete={handleDeleteCategory}
            onRefresh={fetchData}
          />
        );
      
      case "guests":
        return (
          <GuestsSection 
            guests={guests}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onDelete={handleDeleteGuest}
            onRefresh={fetchData}
          />
        );
      
      case "reports":
        return <ReportsSection />;
      
      default:
        return <DashboardSection stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#0F172A] hidden lg:flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 mb-4 flex items-center gap-3 border-b border-slate-800/30">
          <div className="w-12 h-12 bg-[#B91C1C] rounded-full flex items-center justify-center">
            <img
              src={Logo}
              alt="UMC Library Logo"
              className="w-10 h-10 rounded-full sm:w-12 sm:h-12"
            />
          </div>
          <div>
            <h1 className="text-white text-sm font-bold tracking-tight">UMC Library</h1>
            <p className="text-slate-500 text-[10px]">Digital Library System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {/* Menu Dashboard */}
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
            <div className="h-[1px] bg-slate-800/50 w-full" />
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ScanLine size={18} /> Sirkulasi & Scan
          </button>

          {/* Menu Data Koleksi */}
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

          {/* Menu Data Pengunjung */}
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

          {/* Menu Manajemen Kategori */}
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

          {/* Menu Laporan & Statistik */}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pencarian cepat..."
                className="w-[400px] pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-red-500/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="text-slate-400 cursor-pointer" />
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Admin Role
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {/* Render section berdasarkan menu yang dipilih */}
          {renderSection()}
        </div>
      </main>
    </div>
  );
}