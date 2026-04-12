import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dataClient } from "@/lib/dataClient";
import { orderStatusLabel } from "@/lib/orderStatus";
import { StatusBadge } from "@/components/ui/StatusBadge";

type OrderRow = {
  id: string;
  status: string | null | undefined;
  createdAt?: string | null;
  planLabel: string;
};

function badgeTone(status: string | undefined | null) {
  switch (status) {
    case "FULFILLED":
      return "success" as const;
    case "CANCELLED":
      return "danger" as const;
    case "PAYMENT_SUBMITTED":
      return "warning" as const;
    case "PAYMENT_CONFIRMED":
    case "AWAITING_ACCOUNT":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function ClientOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, errors } = await dataClient.models.CustomerOrder.list();
        if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
        const list = data ?? [];
        const enriched: OrderRow[] = [];
        for (const o of list) {
          if (!o.id) continue;
          let planLabel = "—";
          if (o.servicePlanID) {
            const pr = await dataClient.models.ServicePlan.get({ id: o.servicePlanID });
            const p = pr.data;
            if (p) {
              const plr = await dataClient.models.Platform.get({ id: p.platformID });
              planLabel = plr.data ? `${plr.data.name} · ${p.name}` : p.name;
            }
          }
          enriched.push({
            id: o.id,
            status: o.status,
            createdAt: (o as { createdAt?: string }).createdAt,
            planLabel,
          });
        }
        enriched.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        if (!cancelled) setRows(enriched);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar pedidos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mis pedidos</h1>
          <p className="mt-1 max-w-xl text-sm text-mimi-muted">
            Historial de compras de accesos: estado de pago, asignación y entrega de credenciales por pedido.
          </p>
        </div>
        <Link
          to="/catalogo"
          className="inline-flex justify-center rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-extrabold text-mimi-black hover:bg-neutral-200"
        >
          Nuevo pedido
        </Link>
      </div>

      {loading && <MimiLoadingState tone="dark" layout="inline" className="mt-6" />}
      {error && (
        <div className="mt-6 rounded-mimi border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-6 text-mimi-muted">Aún no tienes pedidos.</p>
      )}

      <ul className="mt-8 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              to={`/app/pedidos/${r.id}`}
              className="flex flex-col rounded-mimi border border-white/10 bg-mimi-elevated px-4 py-3 shadow-sm transition hover:border-white/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-white">
                  <span className="text-white/70">Anuncio · </span>
                  {r.planLabel}
                </p>
                <p className="text-xs text-mimi-muted">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "Pedido"}
                </p>
              </div>
              <StatusBadge tone={badgeTone(r.status)}>{orderStatusLabel(r.status)}</StatusBadge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
