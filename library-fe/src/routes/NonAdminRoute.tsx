// Tambahkan kata 'type' sebelum { ReactNode }
import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { authClient } from "@/utils/auth-client";

interface NonAdminRouteProps {
  children: ReactNode;
}

export default function NonAdminRoute({ children }: NonAdminRouteProps) {
  const { data: session, isPending } = authClient.useSession();

  // Tunggu loading session selesai
  if (isPending) {
    return null; // Atau Anda bisa return loading spinner di sini
  }

  // Ambil role user dari session
  const userRole = (session?.user as any)?.role;

  // Jika user adalah super_admin, paksa redirect ke dashboard
  if (userRole === "super_admin") {
    return <Navigate to="/dashboard/super-admin" replace />;
  }

  // Jika bukan super_admin (atau belum login), biarkan akses halaman
  return <>{children}</>;
}