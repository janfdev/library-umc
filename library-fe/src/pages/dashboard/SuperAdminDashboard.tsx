import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate, Link } from "react-router";
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
  Calendar,
  Trash2,
  Edit,
  ChevronRight,
  LayoutDashboard
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

  const fetchData = async () => {
    try {
      // 1. Fetch Collections
      const collectionsRes = await fetch(`${API_BASE_URL}/api/collections`);
      const collectionsData = await collectionsRes.json();
      const collectionsList = collectionsData.success
        ? collectionsData.data
        : [];
      setCollections(collectionsList);

      // 2. Fetch Categories
      const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`);
      const categoriesData = await categoriesRes.json();
      const categoriesList = categoriesData.success ? categoriesData.data : [];
      setCategories(categoriesList);

      // 3. Fetch Guest Logs
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

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Kategori "${name}" berhasil dihapus`);
        fetchData(); // Refresh data
      } else {
        alert(`❌ Gagal menghapus kategori: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Terjadi kesalahan saat menghapus kategori");
    }
  };

  const handleDeleteCollection = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus koleksi "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Koleksi "${title}" berhasil dihapus`);
        fetchData(); // Refresh data
      } else {
        alert(`❌ Gagal menghapus koleksi: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Terjadi kesalahan saat menghapus koleksi");
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (
      !confirm(`Apakah Anda yakin ingin menghapus log pengunjung "${name}"?`)
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/guests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Log pengunjung "${name}" berhasil dihapus`);
        fetchData(); // Refresh data
      } else {
        alert(`❌ Gagal menghapus log: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting guest log:", error);
      alert("Terjadi kesalahan saat menghapus log pengunjung");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar - Clean & Minimalist */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen z-20">
        <div className="p-8">
          <h1 className="text-[#9a1b1b] text-2xl font-black tracking-tighter flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            MUCILIB
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Super Admin Panel
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-[#9a1b1b] hover:bg-red-50 rounded-2xl transition-all"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
          
          <div className="pt-4 pb-2 px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utama</p>
          </div>

          <button
            onClick={() => setActiveTab("collections")}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === "collections"
                ? "bg-[#9a1b1b] text-white shadow-lg shadow-red-900/20"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Book className="w-5 h-5" />
              Koleksi Pustaka
            </div>
            {activeTab === "collections" && <ChevronRight size={14} />}
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === "categories"
                ? "bg-[#9a1b1b] text-white shadow-lg shadow-red-900/20"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5" />
              Kategori
            </div>
            {activeTab === "categories" && <ChevronRight size={14} />}
          </button>

          <button
            onClick={() => setActiveTab("guests")}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === "guests"
                ? "bg-[#9a1b1b] text-white shadow-lg shadow-red-900/20"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              Pengunjung
            </div>
            {activeTab === "guests" && <ChevronRight size={14} />}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9a1b1b] flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {session?.user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "collections" && "Koleksi Pustaka"}
              {activeTab === "categories" && "Kategori Buku"}
              {activeTab === "guests" && "Data Pengunjung"}
            </h2>
            <p className="text-slate-400 font-medium italic">
              Sistem Manajemen Perpustakaan Digital UMC
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === "collections" && (
              <Link
                to="/dashboard/super-admin/collections/add"
                className="bg-[#9a1b1b] hover:bg-[#7a1515] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Tambah Koleksi
              </Link>
            )}
            {activeTab === "categories" && (
              <Link
                to="/dashboard/super-admin/categories/add"
                className="bg-[#9a1b1b] hover:bg-[#7a1515] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Tambah Kategori
              </Link>
            )}
            {activeTab === "guests" && (
              <Link
                to="/dashboard/super-admin/guests/add"
                className="bg-[#9a1b1b] hover:bg-[#7a1515] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-95"
              >
                <UserPlus className="w-5 h-5" />
                Tambah Pengunjung
              </Link>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Book className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Koleksi</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalCollections}</p>
            </div>
            <TrendingUp className="ml-auto w-5 h-5 text-emerald-500 opacity-50" />
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Kategori</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalCategories}</p>
            </div>
            <TrendingUp className="ml-auto w-5 h-5 text-emerald-500 opacity-50" />
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengunjung</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalGuests}</p>
            </div>
            <TrendingUp className="ml-auto w-5 h-5 text-emerald-500 opacity-50" />
          </div>
        </div>

        {/* Search Bar Container */}
        {(activeTab === "collections" || activeTab === "categories") && (
          <div className="mb-8 relative max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input
              type="text"
              placeholder={activeTab === "collections" ? "Cari buku berdasarkan judul atau penulis..." : "Cari kategori..."}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#9a1b1b] transition-all font-medium placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* CONTENT VIEW - Card Based for Collections */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          {activeTab === "collections" && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection) => (
                <div key={collection.id} className="group bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="aspect-[3/4] rounded-xl mb-4 overflow-hidden relative shadow-sm group-hover:shadow-md transition-all">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Book className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button
                        onClick={() => navigate(`/dashboard/collections/edit/${collection.id}`)}
                        className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                        title="Edit Koleksi"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection.id, collection.title)}
                        className="p-3 bg-white text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-90"
                        title="Hapus Koleksi"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-red-50 text-[#9a1b1b] text-[10px] font-bold uppercase tracking-wider">
                      {collection.category?.name || "Uncategorized"}
                    </span>
                    <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight">
                      {collection.title}
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold">
                      {collection.author}
                    </p>
                  </div>
                </div>
              ))}
              {filteredCollections.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Book className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Koleksi tidak ditemukan</p>
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES VIEW */}
          {activeTab === "categories" && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-red-50 text-[#9a1b1b]">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/dashboard/categories/edit/${category.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{category.name}</h3>
                  <p className="text-slate-400 text-[11px] font-medium line-clamp-2 mb-4">
                    {category.description || "Tidak ada deskripsi tersedia"}
                  </p>
                  <div className="pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>ID: #{category.id}</span>
                    <span>{new Date(category.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Tag className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Kategori tidak ditemukan</p>
                </div>
              )}
            </div>
          )}

          {/* GUESTS VIEW - Table Based */}
          {activeTab === "guests" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengunjung</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fakultas / Prodi</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                            {guest.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{guest.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{guest.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                          {guest.identifier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700">{guest.faculty}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{guest.major}</p>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">
                        {new Date(guest.visitDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteGuest(guest.id, guest.name)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredGuests.length === 0 && (
                <div className="py-20 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Data pengunjung kosong</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guest Stats Summary (Visible only in Guest Tab) */}
        {activeTab === "guests" && guests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini</span>
              <span className="text-xl font-black text-slate-900">
                {guests.filter(g => new Date(g.visitDate).toDateString() === new Date().toDateString()).length}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulan Ini</span>
              <span className="text-xl font-black text-slate-900">
                {guests.filter(g => {
                  const now = new Date();
                  const d = new Date(g.visitDate);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}