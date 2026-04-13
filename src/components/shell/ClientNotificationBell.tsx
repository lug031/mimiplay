import { useClientNotifications } from "@/context/ClientNotificationsContext";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function iconBtnClass(extra = "") {
  return `relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/90 transition hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 ${extra}`;
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  /** Botón más pequeño (barra móvil). */
  compact?: boolean;
};

export function ClientNotificationBell({ compact }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { loading, items, unreadCount, markAsRead, markAllAsRead, detailPathFor } = useClientNotifications();

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

  const shown = items.slice(0, 12);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className={iconBtnClass(compact ? "!h-9 !w-9" : "")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[10px] font-extrabold text-mimi-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[70] mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-white/10 bg-mimi-elevated py-2 shadow-xl ring-1 ring-black/40"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-white/70">Notificaciones</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-[11px] font-bold text-amber-200/95 hover:underline"
                onClick={() => void markAllAsRead()}
              >
                Marcar todas leídas
              </button>
            ) : null}
          </div>
          <div className="max-h-[min(60vh,20rem)] overflow-y-auto px-1 py-1">
            {loading && shown.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-white/50">Cargando…</p>
            ) : null}
            {!loading && shown.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-white/50">No tienes avisos.</p>
            ) : null}
            {shown.map((n) => {
              const path = detailPathFor(n);
              const unread = !n.readAt;
              return (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-white/10 ${
                    unread ? "bg-white/[0.06]" : ""
                  }`}
                  onClick={() => {
                    void markAsRead(n.id);
                    if (path) navigate(path);
                    setOpen(false);
                  }}
                >
                  <span className="block font-bold text-white/95">{n.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-white/60">{n.body}</span>
                  {n.createdAt ? (
                    <span className="mt-1 block text-[10px] text-white/35">
                      {new Date(n.createdAt).toLocaleString("es-PE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-white/10 px-2 py-2">
            <Link
              to="/app/notificaciones"
              className="block rounded-lg px-2 py-2 text-center text-xs font-bold text-amber-200/95 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Ver todas
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
