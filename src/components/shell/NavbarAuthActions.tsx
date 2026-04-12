import { useClientAuth } from "@/auth/ClientAuthContext";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function iconBtnClass(extra = "") {
  return `inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/90 transition hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 ${extra}`;
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

type MenuContentProps = {
  onNavigate: () => void;
  isStaffAdmin: boolean;
  userEmail: string | undefined;
  signOutUser: () => Promise<void>;
  /** En móvil el menú sustituye enlaces de la barra; en escritorio ya existen fuera del desplegable. */
  includePrimaryLinks: boolean;
};

function AccountMenuLinks({ onNavigate, isStaffAdmin, userEmail, signOutUser, includePrimaryLinks }: MenuContentProps) {
  return (
    <>
      {includePrimaryLinks ? (
        <>
          {isStaffAdmin ? (
            <Link
              to="/admin"
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
              onClick={onNavigate}
            >
              Panel ADMIN
            </Link>
          ) : (
            <Link
              to="/app/pedidos"
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
              onClick={onNavigate}
            >
              Mis pedidos
            </Link>
          )}
          <div className="my-2 border-t border-white/10" />
        </>
      ) : null}
      <Link to="/app/cuenta" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10" onClick={onNavigate}>
        Mi perfil
      </Link>
      <Link
        to="/app/cuenta#mi-informacion"
        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
        onClick={onNavigate}
      >
        Mi información
      </Link>
      <Link
        to="/app/cuenta#configuracion"
        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
        onClick={onNavigate}
      >
        Configuración
      </Link>
      {userEmail ? (
        <p className="mt-2 truncate px-3 text-[11px] leading-snug text-white/45" title={userEmail}>
          {userEmail}
        </p>
      ) : null}
      <div className="my-2 border-t border-white/10" />
      <button
        type="button"
        className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-red-200/95 hover:bg-red-500/15"
        onClick={() => {
          onNavigate();
          void signOutUser();
        }}
      >
        Cerrar sesión
      </button>
    </>
  );
}

export function NavbarAuthActionsDesktop() {
  const { userEmail, isStaffAdmin, signOutUser } = useClientAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activityTo = isStaffAdmin ? "/admin/pedidos" : "/app/pedidos";

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <Link
        to={activityTo}
        className={iconBtnClass()}
        aria-label={isStaffAdmin ? "Pedidos y cola de staff" : "Pedidos y avisos"}
        title={isStaffAdmin ? "Pedidos (staff)" : "Pedidos y avisos"}
      >
        <BellIcon />
      </Link>

      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          className={iconBtnClass()}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Menú de cuenta"
          onClick={() => setOpen((v) => !v)}
        >
          <UserCircleIcon className="h-6 w-6" />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-[70] mt-2 w-60 min-w-[14rem] rounded-xl border border-white/10 bg-mimi-elevated py-2 shadow-xl ring-1 ring-black/40"
          >
            <div className="max-h-[min(70vh,24rem)] overflow-y-auto px-1">
              <AccountMenuLinks
                onNavigate={() => setOpen(false)}
                isStaffAdmin={isStaffAdmin}
                userEmail={userEmail}
                signOutUser={signOutUser}
                includePrimaryLinks={false}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NavbarAuthActionsMobile() {
  const { userEmail, isStaffAdmin, signOutUser } = useClientAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={iconBtnClass("!h-9 !w-9")}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú de cuenta" : "Abrir menú de cuenta"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <span className="text-lg leading-none" aria-hidden>
            ×
          </span>
        ) : (
          <MenuIcon />
        )}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-[45] bg-black/50 lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed inset-x-0 top-16 z-[55] max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 bg-mimi-black/98 px-4 py-4 pb-6 shadow-xl backdrop-blur-md lg:hidden"
            role="menu"
          >
            <AccountMenuLinks
              onNavigate={() => setOpen(false)}
              isStaffAdmin={isStaffAdmin}
              userEmail={userEmail}
              signOutUser={signOutUser}
              includePrimaryLinks
            />
          </nav>
        </>
      ) : null}
    </>
  );
}
