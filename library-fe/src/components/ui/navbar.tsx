// src/components/ui/navbar.tsx
import { useState, useEffect, useRef } from "react";
import LogoUmc from "@/assets/logo_umc.png";
import { authClient } from "@/utils/auth-client";
import {
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
  BookOpen
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import type { AuthUser } from "@/types/auth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Tambahan state khusus mobile accordion agar sub-menu akun bisa di-toggle dropdown
  const [isMobileSubMenuOpen, setIsMobileSubMenuOpen] = useState(false);

  // Ambil session dari Better Auth
  const { data: session } = authClient.useSession();

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    { name: "Tentang", href: "/tentang" }
  ];

  // Cek apakah link aktif
  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    if (session) {
      await authClient.signOut();
    }

    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const handleMyLoansClick = () => {
    navigate("/my-loans");
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sessionUser = session?.user as AuthUser | undefined;
  const activeUser = sessionUser;
  const isLoggedIn = !!activeUser;

  const activeRole = sessionUser?.role ?? "student";
  const isSuperAdmin = activeRole === "super_admin";

  const roleAppearance = {
    super_admin: {
      label: "Super Admin",
      className: "bg-purple-100 text-purple-700"
    },
    staff: {
      label: "Staff",
      className: "bg-amber-100 text-amber-700"
    },
    lecturer: {
      label: "Lecturer",
      className: "bg-emerald-100 text-emerald-700"
    },
    student: {
      label: "Mahasiswa",
      className: "bg-blue-100 text-blue-700"
    }
  } as const;

  const currentRoleAppearance =
    roleAppearance[activeRole as keyof typeof roleAppearance] ??
    roleAppearance.student;

  // Nama yang ditampilkan
  const displayName = activeUser?.name || "";

  // Email yang ditampilkan
  const displayEmail = activeUser?.email || "";

  return (
    <>
      {/* NAVBAR UTAMA */}
      {/* Diubah z-index ke z-40 agar berada di bawah Tirai Overlay HP */}
      <div className="flex justify-between items-center p-4 px-6 bg-white shadow-sm sticky top-0 z-40">
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white border-2 border-white shadow-sm overflow-hidden">
                  {activeUser?.image ? (
                    <img
                      src={activeUser.image}
                      alt={displayName || "User"}
                      className="w-full h-full object-cover"
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
                      className={`text-[10px] font-bold px-2 py-1 rounded-full mt-1 inline-block ${currentRoleAppearance.className}`}
                    >
                      {currentRoleAppearance.label}
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
          className="md:hidden hamburger p-2 hover:bg-gray-50 rounded-xl transition-all"
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
      {/* Dinaikkan z-index ke z-50 agar menutupi area navbar belakang */}
      <div
        className={`fixed top-0 right-0 w-68 h-full bg-white shadow-2xl z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
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
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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

          {/* Navigation Items (Tanpa UL/LI, Tombol lebih bersih) */}
          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                  setIsMenuOpen(false);
                }}
                className={`text-sm font-semibold py-3 px-4 rounded-xl transition-all relative flex items-center ${
                  isActive(item.href)
                    ? "bg-red-50 text-red-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-red-600"
                }`}
              >
                <span>{item.name}</span>
                {isActive(item.href) && (
                  <span className="absolute left-2 w-1 h-4 bg-red-600 rounded-full"></span>
                )}
              </a>
            ))}
          </nav>

          {/* User Menu / Login - Mobile (Dropdown Mode di Sidebar) */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            {isLoggedIn ? (
              <div className="space-y-2">
                {/* Kotak Akun Utama (Bertindak sebagai Trigger Accordion/Dropdown) */}
                <button
                  onClick={() => setIsMobileSubMenuOpen(!isMobileSubMenuOpen)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all text-left"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white border border-white flex-shrink-0 overflow-hidden">
                      {activeUser?.image ? (
                        <img
                          src={activeUser.image}
                          alt={displayName || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {getInitials(displayName)}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {displayName || "User"}
                      </p>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 inline-block ${currentRoleAppearance.className}`}
                      >
                        {currentRoleAppearance.label}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isMobileSubMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Sub Menu Dropdown Akun di Mobile */}
                <div
                  className={`space-y-1 pl-2 transition-all duration-200 ${
                    isMobileSubMenuOpen ? "block" : "hidden"
                  }`}
                >
                  {!isSuperAdmin && (
                    <>
                      <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Profil Saya</span>
                      </button>

                      <button
                        onClick={handleMyLoansClick}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>Peminjaman Saya</span>
                      </button>
                    </>
                  )}

                  {isSuperAdmin && (
                    <a
                      href="/dashboard/super-admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-500" />
                      <span>Dashboard Admin</span>
                    </a>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-md"
              >
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY / BACKDROP GELAP */}
      {/* Menggunakan z-45 agar berada tepat di atas navbar utama tetapi di bawah sidebar */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-45 transition-all duration-300 animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;