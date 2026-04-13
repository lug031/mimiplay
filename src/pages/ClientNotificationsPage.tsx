import { useClientNotifications } from "@/context/ClientNotificationsContext";
import { Link, useNavigate } from "react-router-dom";

export function ClientNotificationsPage() {
  const navigate = useNavigate();
  const { loading, items, unreadCount, markAsRead, markAllAsRead, detailPathFor } = useClientNotifications();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Notificaciones</h1>
          <p className="mt-1 text-sm text-mimi-muted">Avisos sobre tus pedidos y tu cuenta.</p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
            onClick={() => void markAllAsRead()}
          >
            Marcar todas como leídas
          </button>
        ) : null}
      </div>

      <Link to="/app/pedidos" className="mt-4 inline-block text-sm font-bold text-white/90 hover:underline">
        ← Volver a pedidos
      </Link>

      {loading && items.length === 0 ? (
        <p className="mt-8 text-sm text-mimi-muted">Cargando…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="mt-8 text-sm text-mimi-muted">No hay notificaciones por ahora.</p>
      ) : null}

      <ul className="mt-6 space-y-2">
        {items.map((n) => {
          const path = detailPathFor(n);
          const unread = !n.readAt;
          return (
            <li key={n.id}>
              <button
                type="button"
                className={`w-full rounded-mimi border px-4 py-3 text-left transition hover:border-white/25 ${
                  unread ? "border-amber-400/35 bg-amber-500/10" : "border-white/10 bg-white/[0.04]"
                }`}
                onClick={() => {
                  void markAsRead(n.id);
                  if (path) navigate(path);
                }}
              >
                <span className="font-bold text-white">{n.title}</span>
                <p className="mt-1 text-sm text-white/75">{n.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                  {n.createdAt ? (
                    <span>
                      {new Date(n.createdAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  ) : null}
                  {unread ? <span className="font-bold text-amber-200/90">Sin leer</span> : null}
                  {path ? <span className="text-amber-200/80">Abrir detalle →</span> : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
