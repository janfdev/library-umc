import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { authClient } from "@/utils/auth-client";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole = "super_admin"
}: ProtectedRouteProps) {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending) {
      // Not logged in
      if (!session) {
        navigate("/login");
        return;
      }

      // Logged in but wrong role
      const userRole = (session.user as any).role;
      if (requiredRole && userRole !== requiredRole) {
        navigate("/");
        return;
      }
    }
  }, [session, isPending, navigate, requiredRole]);

  // Avoid double loading UI; page-level skeleton handles content loading.
  if (isPending) {
    return null;
  }

  // Not authorized
  const userRole = session ? (session.user as any).role : null;
  if (!session || (requiredRole && userRole !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
