// src/components/ui/navbar.tsx
import { useState, useEffect, useRef } from "react";
import LogoUmc from "@/assets/logo_umc.png";
import { authClient } from "@/lib/auth-client";
import {
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";

// Interface untuk user dari JWT
interface JwtUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  token?: string;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);

  // Ambil session dari SSO
  const { data: session } = authClient.useSession();

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user dari JWT token di localStorage
  useEffect(() => {
    const loadJwtUser = () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        // Coba decode token atau ambil dari localStorage
        // Biasanya backend mengirim data user saat login
        const userData = localStorage.getItem("user_data");
        if (userData) {
          try {
            setJwtUser(JSON.parse(userData));
          } catch (e) {
            console.error("Failed to parse user data", e);
          }
        } else {
          // Jika tidak ada user_data, set minimal
          setJwtUser({
            id: "",
            name: "User",
            email: "",
            role: "member",
            token: token,
          });
        }
      } else {
        setJwtUser(null);
      }
    };

    loadJwtUser();

    // Listen untuk perubahan localStorage
    const handleStorageChange = () => {
      loadJwtUser();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tutup menu saat tekan Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Navbar items dengan active state
  const navItems = [
    { name: "Beranda", href: "/" },
    { name: "Katalog", href: "/katalog" },
    { name: "E-Resource", href: "/e-resource" },
    { name: "Tentang", href: "/tentang" },
  ];

  // Cek apakah link aktif
  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    // Logout dari SSO jika ada session
    if (session) {
      await authClient.signOut();
    }

    // Hapus data JWT dari localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");

    setJwtUser(null);
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const handleMyLoansClick = () => {
    navigate("/my-loans");
    setIsDropdownOpen(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Tentukan user aktif (prioritas: SSO > JWT)
  const activeUser = session?.user || jwtUser;
  const isLoggedIn = !!activeUser;

  // Tentukan role
  const isSuperAdmin =
    (session?.user as any)?.role === "super_admin" ||
    jwtUser?.role === "super_admin";

  // Nama yang ditampilkan
  const displayName = activeUser?.name || (jwtUser ? "User" : "");

  // Email yang ditampilkan
  const displayEmail = activeUser?.email || jwtUser?.email || "";

  return (
    <>
      {/* NAVBAR UTAMA */}
      <div className="flex justify-between items-center p-4 px-6 bg-white shadow-sm sticky top-0 z-50">
        {/* Logo & Teks */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={LogoUmc}
            alt="UMC Library Logo"
            className="w-10 h-10 rounded-full sm:w-12 sm:h-12"
          />
          <div className="text-sm font-bold text-gray-800">
            <span className="block">UMC</span>
            <span className="block">Library</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex text-md space-x-6 text-gray-700 font-medium">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              className={`hover:text-red-600 transition-colors relative group ${
                isActive(item.href) ? "text-red-700 font-semibold" : ""
              }`}
            >
              {item.name}
              {isActive(item.href) && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-700"></span>
              )}
              <span
                className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full ${
                  isActive(item.href) ? "hidden" : ""
                }`}
              ></span>
            </a>
          ))}
        </nav>

        {/* User Menu / Login Button - Desktop */}
        <div className="hidden md:block relative" ref={dropdownRef}>
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:shadow-md transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white border-2 border-white shadow-sm">
                  {activeUser?.image ? (
                    <img
                      src={activeUser.image}
                      alt={displayName || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {getInitials(displayName)}
                    </span>
                  )}
                </div>
                {/* Name */}
                <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate hidden sm:block">
                  {displayName || "User"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in">
                  {/* User Info Header */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {displayEmail || "Email tidak tersedia"}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full mt-1 inline-block ${
                        isSuperAdmin
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isSuperAdmin ? "Super Admin" : "Member"}
                    </span>
                  </div>

                  {/* Menu Items - Hanya untuk Member/User Biasa */}
                  {!isSuperAdmin && (
                    <>
                      <div className="py-1">
                        <button
                          onClick={handleProfileClick}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors group"
                        >
                          <User className="w-4 h-4 group-hover:text-red-600 transition-colors" />
                          <span>Profil Saya</span>
                        </button>

                        <button
                          onClick={handleMyLoansClick}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors group"
                        >
                          <BookOpen className="w-4 h-4 group-hover:text-red-600 transition-colors" />
                          <span>Peminjaman Saya</span>
                        </button>
                      </div>
                      <div className="border-t border-gray-100 my-1"></div>
                    </>
                  )}

                  {/* Menu Items - Super Admin */}
                  {isSuperAdmin && (
                    <div className="py-1">
                      <a
                        href="/dashboard/super-admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors group"
                      >
                        <LayoutDashboard className="w-4 h-4 group-hover:text-red-600 transition-colors" />
                        <span>Dashboard Admin</span>
                      </a>
                      <div className="border-t border-gray-100 my-1"></div>
                    </div>
                  )}

                  {/* Logout - Untuk Semua Role */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                  >
                    <LogOut className="w-4 h-4 group-hover:text-red-700 transition-colors" />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center space-x-2 hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span>Login</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0z M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Hamburger Menu - Mobile */}
        <button
          className="md:hidden hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* SIDEBAR MOBILE - ANIMASI SMOOTH */}
      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => {
                navigate("/");
                setIsMenuOpen(false);
              }}
            >
              <img
                src={LogoUmc}
                alt="UMC Library Logo"
                className="w-10 h-10 rounded-full"
              />
              <div className="text-sm font-bold text-gray-800">
                <span className="block">UMC</span>
                <span className="block">Library</span>
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-3 mt-4">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                  setIsMenuOpen(false);
                }}
                className={`text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors relative ${
                  isActive(item.href)
                    ? "bg-red-50 text-red-700 font-semibold"
                    : "hover:bg-gray-50 hover:text-red-600"
                }`}
              >
                <span>{item.name}</span>
                {isActive(item.href) && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                )}
              </a>
            ))}
          </nav>

          {/* Divider */}
          {isLoggedIn && <div className="my-4 border-t border-gray-200"></div>}

          {/* User Menu / Login - Mobile */}
          <div className="mt-auto pt-4">
            {isLoggedIn ? (
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center space-x-3 px-3 py-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white border-2 border-white flex-shrink-0">
                    {activeUser?.image ? (
                      <img
                        src={activeUser.image}
                        alt={displayName || "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getInitials(displayName)}
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {displayEmail || "Email tidak tersedia"}
                    </p>
                  </div>
                </div>

                {/* Menu Items - Mobile */}
                <div className="space-y-2">
                  {!isSuperAdmin && (
                    <>
                      <button
                        onClick={() => {
                          handleProfileClick();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="w-5 h-5 text-red-600" />
                        <span className="font-medium">Profil Saya</span>
                      </button>

                      <button
                        onClick={() => {
                          handleMyLoansClick();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <BookOpen className="w-5 h-5 text-red-600" />
                        <span className="font-medium">Peminjaman Saya</span>
                      </button>
                    </>
                  )}

                  {isSuperAdmin && (
                    <a
                      href="/dashboard/super-admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Dashboard Admin</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-full text-sm font-medium flex items-center justify-center space-x-2 hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                <span>Login</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0z M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
