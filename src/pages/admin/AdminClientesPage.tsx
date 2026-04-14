import { useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiButton } from "@/components/ui/MimiButton";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  aggregateClientOrders,
  orderInPeriod,
  periodStartMs,
  priceNum,
  type ClientAggregateRow,
  type ClientOrderInput,
  type ClientPeriodKey,
} from "@/lib/adminClientesAggregate";
import { adminDataClient } from "@/lib/dataClient";
import { formatIsoDateTimeForDisplay } from "@/lib/orderPlanValidity";
import { orderStatusBadgeTone, orderStatusLabel } from "@/lib/orderStatus";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type SortKey = "orders" | "revenue" | "last";

type PlanRow = { id?: string | null; platformID?: string | null; name?: string | null };
type PlatformRow = { id?: string | null; name?: string | null };

function ownerShort(owner: string | null | undefined): string {
  const t = (owner ?? "").trim();
  if (!t) return "—";
  if (t.length <= 14) return t;
  return `${t.slice(0, 10)}…`;
}

function formatPen(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AdminClientesPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<ClientOrderInput[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [period, setPeriod] = useState<ClientPeriodKey>("all");
  const [sort, setSort] = useState<SortKey>("orders");
  const [search, setSearch] = useState("");
  const [timelineFor, setTimelineFor] = useState<ClientAggregateRow | null>(null);

  const planLabel = useMemo(() => {
    const pmap = new Map(platforms.filter((x) => x.id).map((x) => [x.id!, x]));
    const planMap = new Map(plans.filter((x) => x.id).map((x) => [x.id!, x]));
    return (servicePlanID: string): string => {
      const p = planMap.get(servicePlanID);
      const plat = p?.platformID ? pmap.get(p.platformID) : undefined;
      return p ? (plat ? `${plat.name} · ${p.name}` : (p.name ?? "—")) : "—";
    };
  }, [plans, platforms]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [or, pr, plr] = await Promise.all([
        adminDataClient.models.CustomerOrder.list(),
        adminDataClient.models.ServicePlan.list(),
        adminDataClient.models.Platform.list(),
      ]);
      const err = [...(or.errors ?? []), ...(pr.errors ?? []), ...(plr.errors ?? [])];
      if (err.length) throw new Error(err.map((e) => e.message).join("; "));
      const list: ClientOrderInput[] = [];
      for (const o of or.data ?? []) {
        if (!o.id) continue;
        const x = o as ClientOrderInput & { id: string };
        list.push({
          id: o.id,
          status: o.status,
          owner: x.owner,
          payerFullName: o.payerFullName,
          chosenPricePen: x.chosenPricePen,
          createdAt: x.createdAt,
          servicePlanID: o.servicePlanID,
        });
      }
      setRawOrders(list);
      setPlans((pr.data ?? []) as PlanRow[]);
      setPlatforms((plr.data ?? []) as PlatformRow[]);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al cargar pedidos", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!timelineFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTimelineFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [timelineFor]);

  const startMs = useMemo(() => periodStartMs(period), [period]);

  const filteredByPeriod = useMemo(() => {
    return rawOrders.filter((o) => orderInPeriod(o, startMs));
  }, [rawOrders, startMs]);

  const aggregates = useMemo(() => aggregateClientOrders(filteredByPeriod), [filteredByPeriod]);

  const sortedRows = useMemo(() => {
    const arr: ClientAggregateRow[] = [...aggregates.values()];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? arr.filter((r) => {
          return (
            r.payerLabel.toLowerCase().includes(q) ||
            r.ownerSub.toLowerCase().includes(q) ||
            r.key.toLowerCase().includes(q)
          );
        })
      : arr;
    filtered.sort((a, b) => {
      if (sort === "revenue") return b.revenuePen - a.revenuePen || b.orderCount - a.orderCount;
      if (sort === "last") {
        const ta = a.lastOrderAt ? Date.parse(a.lastOrderAt) : 0;
        const tb = b.lastOrderAt ? Date.parse(b.lastOrderAt) : 0;
        return tb - ta || b.orderCount - a.orderCount;
      }
      return b.orderCount - a.orderCount || b.revenuePen - a.revenuePen;
    });
    return filtered;
  }, [aggregates, search, sort]);

  const totals = useMemo(() => {
    let orders = 0;
    let revenue = 0;
    for (const r of filteredByPeriod) {
      orders += 1;
      if (r.status === "FULFILLED") revenue += priceNum(r.chosenPricePen);
    }
    return {
      clients: aggregates.size,
      orders,
      revenue,
    };
  }, [aggregates, filteredByPeriod]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-mimi-black">Clientes</h1>
      <p className="mt-2 max-w-3xl text-sm text-mimi-subtle">
        Agregación por titular de pedido: usuarios con sesión se agrupan por{" "}
        <strong className="font-bold text-mimi-black">sub</strong> de Cognito; el resto se agrupa por nombre del
        comprador (puede coincidir entre personas distintas). Los importes suman solo pedidos{" "}
        <strong className="font-bold text-mimi-black">entregados</strong> con precio registrado. Para{" "}
        <strong className="font-bold text-mimi-black">exportar CSV</strong> ve a{" "}
        <Link
          to="/admin/informes?pestana=reportes#reporte-clientes"
          className="font-bold text-mimi-black underline decoration-mimi-black/30 underline-offset-2"
        >
          Informes → Reportes
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-mimi-subtle">
        <span className="rounded-full bg-mimi-black/[0.06] px-3 py-1">
          Clientes (clave): <strong className="text-mimi-black">{totals.clients}</strong>
        </span>
        <span className="rounded-full bg-mimi-black/[0.06] px-3 py-1">
          Pedidos en periodo: <strong className="text-mimi-black">{totals.orders}</strong>
        </span>
        <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-emerald-950">
          Ingreso S/ entregados: <strong>{formatPen(totals.revenue)}</strong>
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-bold text-mimi-muted">
          Periodo
          <select
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm font-semibold text-mimi-black"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ClientPeriodKey)}
          >
            <option value="all">Todo el historial</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Últimos 12 meses</option>
          </select>
        </label>
        <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-bold text-mimi-muted">
          Ordenar por
          <select
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm font-semibold text-mimi-black"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="orders">Nº de pedidos</option>
            <option value="revenue">Ingreso entregado (S/)</option>
            <option value="last">Última compra</option>
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-col gap-1 text-xs font-bold text-mimi-muted lg:flex-1">
          Buscar
          <input
            type="search"
            placeholder="Nombre, sub o clave…"
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <MimiButton variant="outline" className="!text-xs sm:!text-sm" onClick={() => void load()}>
            Actualizar
          </MimiButton>
        </div>
      </div>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-6" />}

      {!loading && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-mimi-black/12 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-mimi-black/12 bg-mimi-black/[0.06]">
              <tr>
                <th className="px-3 py-2 font-bold">Titular</th>
                <th className="px-3 py-2 font-bold">Sub (Cognito)</th>
                <th className="px-3 py-2 font-bold text-right">Pedidos</th>
                <th className="px-3 py-2 font-bold text-right">Entreg.</th>
                <th className="px-3 py-2 font-bold text-right">En curso</th>
                <th className="px-3 py-2 font-bold text-right">Cancel.</th>
                <th className="px-3 py-2 font-bold text-right">Ingreso S/</th>
                <th className="px-3 py-2 font-bold">Última compra</th>
                <th className="px-3 py-2 font-bold text-right">Historial</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => {
                const ticket = r.fulfilledCount > 0 ? r.revenuePen / r.fulfilledCount : 0;
                return (
                  <tr key={r.key} className="border-b border-mimi-black/12 last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium text-mimi-black">{r.payerLabel}</div>
                      {!r.hasCognitoOwner ? (
                        <div className="mt-0.5 text-xs text-amber-800">Sin sesión · agrupado por nombre</div>
                      ) : null}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2 font-mono text-xs text-mimi-subtle">
                      {r.hasCognitoOwner ? ownerShort(r.ownerSub) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.orderCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-mimi-subtle">{r.fulfilledCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-mimi-subtle">{r.inProgressCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-mimi-subtle">{r.cancelledCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="font-semibold text-mimi-black">{formatPen(r.revenuePen)}</span>
                      {r.fulfilledCount > 0 ? (
                        <div className="text-xs text-mimi-muted">Ticket {formatPen(ticket)}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-mimi-subtle">
                      {r.lastOrderAt ? formatIsoDateTimeForDisplay(r.lastOrderAt) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MimiButton
                        type="button"
                        variant="outline"
                        className="!px-3 !py-1.5 !text-xs"
                        onClick={() => setTimelineFor(r)}
                      >
                        Ver pedidos
                      </MimiButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!sortedRows.length ? (
            <p className="px-4 py-8 text-center text-sm text-mimi-muted">No hay datos en este periodo o búsqueda.</p>
          ) : null}
        </div>
      )}

      {timelineFor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => setTimelineFor(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-2xl border border-mimi-black/10 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-timeline-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-mimi-black/10 px-5 py-4">
              <div className="min-w-0">
                <h2 id="client-timeline-title" className="text-lg font-extrabold text-mimi-black">
                  Pedidos del cliente
                </h2>
                <p className="mt-1 truncate text-sm font-semibold text-mimi-black">{timelineFor.payerLabel}</p>
                {timelineFor.hasCognitoOwner ? (
                  <p className="mt-0.5 truncate font-mono text-xs text-mimi-subtle" title={timelineFor.ownerSub}>
                    {timelineFor.ownerSub}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-800">Sin cuenta web · agrupado solo por nombre</p>
                )}
                <p className="mt-2 text-xs text-mimi-muted">
                  Periodo seleccionado en la tabla: más antiguo arriba, más reciente abajo.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-mimi-black/12 px-3 py-1.5 text-xs font-bold text-mimi-black hover:bg-mimi-black/[0.04]"
                onClick={() => setTimelineFor(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="max-h-[calc(88vh-8rem)] overflow-y-auto overscroll-contain px-5 py-4">
              <ol className="space-y-0">
                {timelineFor.orders.map((o, idx) => (
                  <li key={o.id} className="flex gap-3 pb-8 last:pb-0">
                    <div className="flex w-5 shrink-0 flex-col items-center self-stretch pt-1">
                      <span className="z-[1] h-3 w-3 shrink-0 rounded-full border-2 border-white bg-mimi-black shadow-sm ring-1 ring-mimi-black/10" />
                      {idx < timelineFor.orders.length - 1 ? (
                        <span className="mt-1 w-px flex-1 bg-mimi-black/12" aria-hidden />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl border border-mimi-black/10 bg-mimi-black/[0.02] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <time className="text-xs font-bold text-mimi-subtle">
                          {o.createdAt ? formatIsoDateTimeForDisplay(o.createdAt) : "Sin fecha"}
                        </time>
                        <StatusBadge tone={orderStatusBadgeTone(o.status)} variant="onLight">
                          {orderStatusLabel(o.status)}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-mimi-black">{planLabel(o.servicePlanID)}</p>
                      <p className="mt-1 font-mono text-[11px] text-mimi-muted">ID {o.id.slice(0, 8)}…</p>
                      {o.chosenPricePen != null && Number.isFinite(o.chosenPricePen) ? (
                        <p className="mt-1 text-xs tabular-nums text-mimi-subtle">
                          Precio elegido:{" "}
                          <span className="font-semibold text-mimi-black">{formatPen(o.chosenPricePen)}</span>
                        </p>
                      ) : null}
                      <div className="mt-3">
                        <Link
                          to={`/admin/pedidos?order=${encodeURIComponent(o.id)}`}
                          className="text-xs font-extrabold text-mimi-black underline decoration-mimi-black/25 underline-offset-2 hover:decoration-mimi-black"
                        >
                          Abrir en Pedidos →
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
