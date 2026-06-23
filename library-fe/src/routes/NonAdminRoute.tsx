import { type ReactNode, useRef } from "react";
import { Navigate } from "react-router";
import { authClient } from "@/utils/auth-client";

interface NonAdminRouteProps {
  children: ReactNode;
}

export default function NonAdminRoute({ children }: NonAdminRouteProps) {
  const { data: session, isPending } = authClient.useSession();
  const hasLoadedOnce = useRef(false);

  if (!isPending) hasLoadedOnce.current = true;

  if (isPending && !hasLoadedOnce.current) {
    return null;
  }

  const userRole = (session?.user as any)?.role;

  if (userRole === "super_admin") {
    return <Navigate to="/dashboard/super-admin" replace />;
  }

  return <>{children}</>;
}