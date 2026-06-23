import { type ReactNode, useRef } from "react";
import { Navigate } from "react-router";
import { authClient } from "@/utils/auth-client";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const hasLoadedOnce = useRef(false);

  if (!isPending) hasLoadedOnce.current = true;

  // Hanya block render pada initial load, bukan refetch (tab focus)
  if (isPending && !hasLoadedOnce.current) return null;

  if (session) {
    const role = (session.user as any)?.role;
    if (role === "super_admin") {
      return <Navigate to="/dashboard/super-admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}