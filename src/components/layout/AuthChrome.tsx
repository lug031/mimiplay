import { useAuthenticator } from "@aws-amplify/ui-react";
import { Link, Outlet } from "react-router-dom";

type Props = {
  variant: "client" | "admin";
};

export function AuthChrome({ variant }: Props) {
  const { signOut, user } = useAuthenticator();

  return (
    <div className="min-h-screen bg-tcr-bg font-manrope">
      <header className="sticky top-0 z-40 border-b border-tcr-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-tcr-dark">
            Mimi<span className="text-tcr-teal">Play</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold text-tcr-dark">
            {variant === "client" ? (
              <>
                <Link className="rounded-lg px-2 py-1 hover:bg-white" to="/app/inicio">
                  Inicio
                </Link>
                <Link className="rounded-lg px-2 py-1 hover:bg-white" to="/app/pedidos">
                  Mis pedidos
                </Link>
              </>
            ) : (
              <>
                <Link className="rounded-lg px-2 py-1 hover:bg-white" to="/admin">
                  Panel
                </Link>
                <Link className="rounded-lg px-2 py-1 hover:bg-white" to="/admin/inventario">
                  Inventario
                </Link>
                <Link className="rounded-lg px-2 py-1 hover:bg-white" to="/admin/cola">
                  Cola de asignación
                </Link>
              </>
            )}
            <span className="hidden text-tcr-text-muted sm:inline">{user?.signInDetails?.loginId}</span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-tcr-border bg-white px-3 py-1 text-xs font-bold text-tcr-dark hover:border-tcr-teal hover:text-tcr-teal"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
