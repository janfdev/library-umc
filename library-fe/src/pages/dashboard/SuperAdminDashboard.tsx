import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate, Link } from "react-router";
import Logo from "@/assets/logo_umc.png"
import {
  Book,
  Users,
  TrendingUp,
  Search,
  Plus,
  Tag,
  UserPlus,
  LogOut,
  Home,
  Trash2,
  Edit,
  LayoutDashboard,
  Bell,
  ScanLine,
  Wallet,
  BarChart3,
  ArrowRight,
  Clock
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

// --- TYPES (TETAP SAMA) ---
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
}

export default function SuperAdminDashboard() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [guests, setGuests] = useState<GuestLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCollections: 0,
    totalCategories: 0,
    totalGuests: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "collections" | "categories" | "guests"
  >("collections");

  // --- LOGIKA FETCH (TETAP SAMA) ---
  const fetchData = async () => {
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
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIKA FILTER (TETAP SAMA) ---
  const filteredCollections = collections.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredGuests = guests.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.major.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  // --- LOGIKA DELETE (TETAP SAMA) ---
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: "DELETE", credentials: "include" });
      if ((await res.json()).success) fetchData();
    } catch (error) { console.error(error); }
  };

  const handleDeleteCollection = async (id: string, title: string) => {
    if (!confirm(`Hapus koleksi "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/collections/${id}`, { method: "DELETE", credentials: "include" });
      if ((await res.json()).success) fetchData();
    } catch (error) { console.error(error); }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Hapus log pengunjung "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/guests/${id}`, { method: "DELETE", credentials: "include" });
      if ((await res.json()).success) fetchData();
    } catch (error) { console.error(error); }
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
          <button
            onClick={() => setActiveTab("collections")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === "collections" ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          
          <div className="py-4 px-4"><div className="h-[1px] bg-slate-800/50 w-full" /></div>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ScanLine size={18} /> Sirkulasi & Scan
          </button>

          <button 
            onClick={() => setActiveTab("collections")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === "collections" ? "text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Book size={18} /> Data Koleksi
          </button>

          <button 
             onClick={() => setActiveTab("guests")}
             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === "guests" ? "bg-[#B91C1C] text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users size={18} /> Data Pengunjung
          </button>

          <button 
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === "categories" ? "bg-[#B91C1C] text-white shadow-lg shadow-red-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Tag size={18} /> Manajemen Kategori
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <BarChart3 size={18} /> Laporan & Statistik
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/50">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 transition-all">
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
                <p className="text-sm font-bold text-slate-900 leading-tight">{session?.user?.name || "Admin"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Role</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {/* Section Ringkasan */}
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-bold text-slate-900">Ringkasan Sistem</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Pantau aktivitas perpustakaan hari ini.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Koleksi', value: stats.totalCollections, icon: <Book />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Sedang Dipinjam', value: '346', icon: <Clock />, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Anggota Aktif', value: stats.totalGuests, icon: <Users />, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Denda Terlambat', value: stats.totalCollections, icon: <Wallet />, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 flex items-center justify-between border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-900">
                {activeTab === "collections" && "Koleksi Pustaka"}
                {activeTab === "categories" && "Kategori Buku"}
                {activeTab === "guests" && "Data Pengunjung"}
              </h3>
              <div className="flex items-center gap-4">
                {activeTab === "collections" && (
                   <Link to="/dashboard/super-admin/collections/add" className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20">
                     <Plus size={16} /> Tambah Koleksi
                   </Link>
                )}
                {activeTab === "categories" && (
                   <Link to="/dashboard/super-admin/categories/add" className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20">
                     <Plus size={16} /> Tambah Kategori
                   </Link>
                )}
                {activeTab === "guests" && (
                   <Link to="/dashboard/super-admin/guests/add" className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20">
                     <UserPlus size={16} /> Tambah Pengunjung
                   </Link>
                )}
                <button className="text-[#B91C1C] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  Lihat Semua <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* RENDER GUESTS */}
              {activeTab === "guests" && (
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b border-slate-50">
                        <th className="px-6 py-4">Pengunjung</th>
                        <th className="px-6 py-4 text-center">Identitas</th>
                        <th className="px-6 py-4 text-center">Fakultas / Prodi</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">{guest.name[0]}</div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{guest.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{guest.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold tracking-tight">{guest.identifier}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <p className="text-xs font-bold text-slate-700 uppercase">{guest.faculty}</p>
                            <p className="text-[10px] text-slate-400 font-medium italic">{guest.major}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button onClick={() => handleDeleteGuest(guest.id, guest.name)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RENDER COLLECTIONS */}
              {activeTab === "collections" && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCollections.map((collection) => (
                    <div key={collection.id} className="group bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="aspect-[3/4] rounded-xl mb-4 overflow-hidden relative shadow-sm">
                        {collection.image ? (
                          <img src={collection.image} alt={collection.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center"><Book className="w-12 h-12 text-slate-400" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button onClick={() => navigate(`/dashboard/collections/edit/${collection.id}`)} className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteCollection(collection.id, collection.title)} className="p-3 bg-white text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="space-y-2 text-center">
                        <span className="px-3 py-1 rounded-full bg-red-50 text-[#B91C1C] text-[10px] font-bold uppercase tracking-wider">{collection.category?.name || "Umum"}</span>
                        <h3 className="font-bold text-slate-800 line-clamp-1 leading-tight">{collection.title}</h3>
                        <p className="text-slate-400 text-xs font-semibold italic">{collection.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER CATEGORIES */}
              {activeTab === "categories" && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-red-50 text-[#B91C1C]"><Tag className="w-5 h-5" /></div>
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/dashboard/categories/edit/${category.id}`)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteCategory(category.id, category.name)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">{category.name}</h3>
                      <p className="text-slate-400 text-[11px] font-medium line-clamp-2">{category.description || "Tidak ada deskripsi"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}