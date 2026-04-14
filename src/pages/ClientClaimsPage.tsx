import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { dataClient } from "@/lib/dataClient";
import { claimStatusBadgeTone, claimStatusLabel } from "@/lib/orderStatus";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Row = {
  id: string;
  orderID: string;
  planLabel: string;
  status: string | null | undefined;
  createdAt?: string | null;
  excerpt: string;
};

async function planLabelForOrder(servicePlanID: string | undefined): Promise<string> {
  if (!servicePlanID) return "—";
  try {
    const pr = await dataClient.models.ServicePlan.get({ id: servicePlanID });
    const p = pr.data;
    if (!p) return "—";
    const plr = await dataClient.models.Platform.get({ id: p.platformID });
    return plr.data ? `${plr.data.name} · ${p.name}` : p.name;
  } catch {
    return "—";
  }
}

export function ClientClaimsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, errors } = await dataClient.models.CustomerClaim.list();
        if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
        const list = data ?? [];
        const enriched: Row[] = [];
        for (const c of list) {
          if (!c.id || !c.orderID) continue;
          const or = await dataClient.models.CustomerOrder.get({ id: c.orderID });
          const o = or.data;
          const planLabel = await planLabelForOrder(o?.servicePlanID);
          const detail = (c.detail ?? "").trim();
          enriched.push({
            id: c.id,
            orderID: c.orderID,
            planLabel,
            status: c.status,
            createdAt: (c as { createdAt?: string }).createdAt,
            excerpt: detail.length > 120 ? `${detail.slice(0, 120)}…` : detail,
          });
        }
        enriched.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        if (!cancelled) setRows(enriched);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar reclamos");
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
          <h1 className="text-2xl font-extrabold text-white">Mis reclamos</h1>
          <p className="mt-1 max-w-xl text-sm text-mimi-muted">
            Registra incidencias sobre un pedido concreto y consulta la respuesta del equipo cuando esté lista.
          </p>
        </div>
        <Link
          to="/app/reclamos/nuevo"
          className="inline-flex justify-center rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-extrabold text-mimi-black hover:bg-neutral-200"
        >
          Nuevo reclamo
        </Link>
      </div>

      {loading && <MimiLoadingState tone="dark" layout="inline" className="mt-6" />}
      {error && (
        <div className="mt-6 rounded-mimi border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-6 text-mimi-muted">
          No tienes reclamos aún.{" "}
          <Link to="/app/reclamos/nuevo" className="font-bold text-white underline">
            Crear el primero
          </Link>
        </p>
      )}

      <ul className="mt-8 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              to={`/app/reclamos/${r.id}`}
              className="flex flex-col rounded-mimi border border-white/10 bg-mimi-elevated px-4 py-3 shadow-sm transition hover:border-white/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-bold text-white">
                  <span className="text-white/70">Pedido · </span>
                  {r.planLabel}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-white/70">{r.excerpt}</p>
                <p className="mt-1 text-xs text-mimi-muted">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString("es-PE") : ""}
                </p>
              </div>
              <div className="mt-2 shrink-0 sm:mt-0">
                <StatusBadge tone={claimStatusBadgeTone(r.status)} variant="onDark">
                  {claimStatusLabel(r.status)}
                </StatusBadge>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
