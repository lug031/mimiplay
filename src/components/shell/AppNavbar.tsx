import { useClientAuth } from "@/auth/ClientAuthContext";
import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";
import { NavbarAuthActionsDesktop, NavbarAuthActionsMobile } from "@/components/shell/NavbarAuthActions";
import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  /** Enlaces extra tipo landing (ayuda, acceso cuenta). */
  marketingExtras?: boolean;
};

function NavbarAuthSessionPlaceholder() {
  return (
    <div
      className="flex items-center gap-2"
      aria-busy="true"
      aria-label="Comprobando sesión"
    >
      <div className="h-9 w-32 animate-pulse rounded-lg bg-white/10 sm:w-40" />
    </div>
  );
}

export function AppNavbar({ marketingExtras = false }: Props) {
  const { user, isStaffAdmin, loading: authLoading } = useClientAuth();
  const location = useLocation();
  const onAuthRoute =
    location.pathname.startsWith("/app/acceso") ||
    location.pathname === "/app/login" ||
    location.pathname === "/app/registro";
  const returnUrl = encodeURIComponent(location.pathname + location.search);

  const panelAdminNavClass =
    "rounded-full border border-amber-400/45 bg-amber-500/15 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-50 shadow-sm transition hover:border-amber-300/70 hover:bg-amber-500/25 sm:text-sm";

  return (
    <Fragment>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-mimi-black/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6">
        <MimiPlayLogo to={isStaffAdmin && user ? "/admin" : "/"} variant="icon" heightClass="h-9 w-9 sm:h-11 sm:w-11" />

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            to="/catalogo"
            data-onboarding-target="catalogo"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Catálogo
          </Link>

          {marketingExtras ? (
            <a
              href="#faq"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("faq");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  window.history.replaceState(null, "", "#faq");
                }
              }}
            >
              Ayuda
            </a>
          ) : null}

          {authLoading ? (
            <NavbarAuthSessionPlaceholder />
          ) : user ? (
            <>
              {isStaffAdmin ? (
                <Link to="/admin" className={panelAdminNavClass}>
                  Panel ADMIN
                </Link>
              ) : (
                <>
                  <Link
                    to="/app/pedidos"
                    data-onboarding-target="pedidos"
                    className="rounded-lg px-2 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    Mis pedidos
                  </Link>
                  <Link
                    to="/app/reclamos"
                    data-onboarding-target="reclamos"
                    className="rounded-lg px-2 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    Reclamos
                  </Link>
                </>
              )}
              <NavbarAuthActionsDesktop />
            </>
          ) : marketingExtras ? (
            <>
              <Link
                to={`/app/acceso/login?returnUrl=${returnUrl}`}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Ingresar
              </Link>
              <MimiButton to="/app/acceso/registro" variant="primary" className="!px-4 !py-2 !text-xs sm:!text-sm">
                Crear cuenta
              </MimiButton>
            </>
          ) : !onAuthRoute ? (
            <>
              <Link
                to={`/app/acceso/login?returnUrl=${returnUrl}`}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Ingresar
              </Link>
              <MimiButton to="/app/acceso/registro" variant="primary" className="!px-3 !py-1.5 !text-xs">
                Crear cuenta
              </MimiButton>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/catalogo"
            data-onboarding-target="catalogo"
            className="rounded-lg px-2 py-2 text-xs font-bold text-white/90 hover:bg-white/10"
          >
            Catálogo
          </Link>
          {authLoading ? (
            <NavbarAuthSessionPlaceholder />
          ) : user ? (
            <NavbarAuthActionsMobile />
          ) : marketingExtras ? (
            <>
              <Link
                to={`/app/acceso/login?returnUrl=${returnUrl}`}
                className="rounded-lg px-2 py-2 text-xs font-bold text-white/90 hover:bg-white/10"
              >
                Ingresar
              </Link>
              <MimiButton to="/app/acceso/registro" variant="primary" className="!px-3 !py-2 !text-xs">
                Crear cuenta
              </MimiButton>
            </>
          ) : onAuthRoute ? null : (
            <>
              <Link
                to={`/app/acceso/login?returnUrl=${returnUrl}`}
                className="rounded-lg px-2 py-2 text-xs font-bold text-white/90"
              >
                Ingresar
              </Link>
              <MimiButton to="/app/acceso/registro" variant="primary" className="!px-2 !py-2 !text-xs">
                Crear cuenta
              </MimiButton>
            </>
          )}
        </div>
      </div>
    </header>
      {/* Reserva altura: el header es fixed y no ocupa flujo */}
      <div className="h-16 shrink-0 sm:h-[4.25rem]" aria-hidden />
    </Fragment>
  );
}
