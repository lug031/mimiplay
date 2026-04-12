import { AppNavbar } from "@/components/shell/AppNavbar";
import { Outlet, useLocation } from "react-router-dom";

/** Portal cliente: navbar; login/registro a pantalla completa sin barra superior. */
export function ClientPortalLayout() {
  const { pathname } = useLocation();
  const authFullBleed =
    pathname.startsWith("/app/acceso") || pathname === "/app/login" || pathname === "/app/registro";

  return (
    <div className="flex min-h-screen flex-col bg-mimi-black font-manrope text-white">
      {!authFullBleed ? <AppNavbar /> : null}
      <main
        className={
          authFullBleed
            ? "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden"
            : "mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
