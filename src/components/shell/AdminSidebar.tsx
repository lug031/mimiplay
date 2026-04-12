import { useClientAuth } from "@/auth/ClientAuthContext";
import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";
import { Link, NavLink } from "react-router-dom";

const nav: { to: string; label: string; end?: boolean }[] = [
  { to: "/admin", label: "Resumen", end: true },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/cola", label: "Cola de pago" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/inventario", label: "Inventario" },
];

export function AdminSidebar() {
  const { signOutUser, userEmail } = useClientAuth();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-mimi-black text-white md:w-60 md:border-b-0 md:border-r md:border-white/10">
      <div className="border-b border-white/10 px-4 py-5">
        <MimiPlayLogo to="/admin" heightClass="h-8" />
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-mimi-muted">Administración</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={Boolean(item.end)}
            className={({ isActive }) =>
              [
                "rounded-mimi px-3 py-2.5 text-sm font-semibold transition",
                isActive ? "bg-white text-mimi-black" : "text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          to="/catalogo"
          className="mb-2 block rounded-mimi px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
        >
          Ver tienda pública (catálogo)
        </Link>
        <p className="truncate text-xs text-mimi-muted" title={userEmail}>
          {userEmail}
        </p>
        <MimiButton variant="secondary" className="mt-2 w-full !py-2 !text-xs" onClick={() => void signOutUser()}>
          Cerrar sesión
        </MimiButton>
      </div>
    </aside>
  );
}
