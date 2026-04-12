import { useClientAuth } from "@/auth/ClientAuthContext";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/** Rutas bajo `/app/*` autenticadas; `/app/acceso/*` (login/registro) queda fuera como rutas hermanas. */
export function RequireClientAuth() {
  const { user, loading, isStaffAdmin } = useClientAuth();
  const location = useLocation();

  if (loading) {
    return <MimiLoadingState tone="dark" layout="viewport" />;
  }

  if (!user) {
    return (
      <Navigate
        to={`/app/acceso/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (isStaffAdmin && !location.pathname.startsWith("/app/cuenta")) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
