// Tambahkan kata 'type' sebelum { ReactNode }
import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { authClient } from "@/utils/auth-client";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  // Jika sudah login, jangan biarkan akses halaman login/register
  if (session) {
    // Arahkan ke dashboard admin jika dia admin, atau ke home jika user biasa
    const role = (session.user as any)?.role;
    if (role === "super_admin") {
      return <Navigate to="/dashboard/super-admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Jika belum login, tampilkan halaman (login/register)
  return <>{children}</>;
}