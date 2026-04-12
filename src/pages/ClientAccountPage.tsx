import { useClientAuth } from "@/auth/ClientAuthContext";
import { MimiButton } from "@/components/ui/MimiButton";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export function ClientAccountPage() {
  const { userEmail, isStaffAdmin, signOutUser } = useClientAuth();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mi cuenta</h1>
          <p className="mt-1 max-w-xl text-sm text-mimi-muted">
            Datos de acceso y preferencias básicas. Para pedidos y credenciales usa{" "}
            <Link
              to={isStaffAdmin ? "/admin/pedidos" : "/app/pedidos"}
              className="font-semibold text-white/90 underline-offset-2 hover:underline"
            >
              {isStaffAdmin ? "Pedidos (staff)" : "Mis pedidos"}
            </Link>
            .
          </p>
        </div>
        <MimiButton variant="secondary" className="!shrink-0 self-start" onClick={() => void signOutUser()}>
          Cerrar sesión
        </MimiButton>
      </div>

      {isStaffAdmin ? (
        <p className="mt-6 rounded-mimi border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
          Sesión con permisos de staff. El panel operativo está en{" "}
          <Link to="/admin" className="font-bold underline-offset-2 hover:underline">
            /admin
          </Link>
          .
        </p>
      ) : null}

      <section id="mi-informacion" className="mt-10 scroll-mt-28 rounded-mimi border border-white/10 bg-mimi-elevated p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-white">Mi información</h2>
        <p className="mt-2 text-sm text-mimi-muted">Correo asociado a tu cuenta en MimiPlay.</p>
        <p className="mt-4 break-all text-sm font-semibold text-white/90">{userEmail ?? "—"}</p>
      </section>

      <section id="configuracion" className="mt-6 scroll-mt-28 rounded-mimi border border-white/10 bg-mimi-elevated p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-white">Configuración</h2>
        <p className="mt-2 text-sm text-mimi-muted">
          Pronto podrás gestionar avisos, idioma y otras preferencias desde aquí. Mientras tanto, el catálogo y tus pedidos siguen disponibles en la barra
          superior.
        </p>
      </section>
    </div>
  );
}
