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
        <h1 className="text-2xl font-extrabold text-tcr-dark">Mis pedidos</h1>
        <Link
          to="/app/planes"
          className="inline-flex justify-center rounded-full bg-tcr-teal px-5 py-2 text-sm font-bold text-white hover:bg-[#007a8f]"
        >
          Nuevo pedido
        </Link>
      </div>

      {loading && <p className="mt-6 text-tcr-text-muted">Cargando…</p>}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-6 text-tcr-text-muted">Aún no tienes pedidos.</p>
      )}

      <ul className="mt-8 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              to={`/app/pedidos/${r.id}`}
              className="flex flex-col rounded-xl border border-tcr-border bg-white px-4 py-3 shadow-sm transition hover:border-tcr-teal sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-tcr-dark">{r.planLabel}</p>
                <p className="text-xs text-tcr-text-muted">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString("es-PE") : "Pedido"}
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
