import { useClientAuth } from "@/auth/ClientAuthContext";
import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";
import { MimiCard } from "@/components/ui/MimiCard";

/**
 * Usuario autenticado sin rol de administración en `/admin`.
 * Misma envoltura visual que el login de staff, sin exponer detalles técnicos.
 */
export function AdminAccessDenied() {
  const { signOutUser } = useClientAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mimi-black px-4 py-12 font-manrope text-white">
      <div className="mb-8 flex flex-col items-center text-center">
        <MimiPlayLogo to={false} heightClass="h-10" />
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-mimi-muted">Acceso administración</p>
      </div>

      <MimiCard variant="dark" padding="lg" className="w-full max-w-md border border-white/10 bg-mimi-elevated">
        <h1 className="text-center text-lg font-extrabold text-white">Sin acceso al panel</h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-white/70">
          Tu cuenta no tiene permisos para el panel administrativo. Si crees que es un error, contacta con quien gestione los accesos en tu
          organización.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <MimiButton variant="primary" className="!w-full !py-3" onClick={() => void signOutUser()}>
            Cerrar sesión
          </MimiButton>
          <MimiButton to="/catalogo" variant="secondary" className="!w-full !py-3">
            Ir a la tienda pública
          </MimiButton>
        </div>
      </MimiCard>
    </div>
  );
}
