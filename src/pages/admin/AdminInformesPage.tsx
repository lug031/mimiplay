import { useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { ReportBarChart, ReportLineChart, ReportPieChart } from "@/components/admin/ReportCharts";
import { MimiButton } from "@/components/ui/MimiButton";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import {
  aggregateClientOrders,
  orderInPeriod,
  periodStartMs,
  type ClientAggregateRow,
  type ClientPeriodKey,
} from "@/lib/adminClientesAggregate";
import {
  barPedidosPorEstado,
  kpisFromOrders,
  linePedidosPorDia,
  pieIngresosPorAnuncio,
  pieVigenciaAcceso,
} from "@/lib/adminInformesMetrics";
import { buildClientesCsvLines, buildValidityCsvLines, downloadUtf8Csv } from "@/lib/adminReportCsv";
import { buildValidityRows, filterValidityRows, type ValidityRowBase } from "@/lib/adminValidityRows";
import { adminDataClient } from "@/lib/dataClient";
import type { PlanValiditySegment } from "@/lib/orderPlanValidity";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

type TabKey = "dashboard" | "reportes";

type PlanRow = { id?: string | null; platformID?: string | null; name?: string | null };
type PlatformRow = { id?: string | null; name?: string | null };
type OrderRow = {
  id?: string | null;
  servicePlanID: string;
  status?: string | null;
  payerFullName?: string | null;
  chosenOptionLabel?: string | null;
  chosenDurationDays?: number | null;
  chosenPricePen?: number | null;
  fulfilledAt?: string | null;
  activationStartsAt?: string | null;
  credentialRenewsAt?: string | null;
  createdAt?: string | null;
  owner?: string | null;
};

function usePlanLabelResolver(plans: PlanRow[], platforms: PlatformRow[]) {
  return useMemo(() => {
    const pmap = new Map(platforms.filter((x) => x.id).map((x) => [x.id!, x]));
    const planMap = new Map(plans.filter((x) => x.id).map((x) => [x.id!, x]));
    return (servicePlanID: string): string => {
      const p = planMap.get(servicePlanID);
      const plat = p?.platformID ? pmap.get(p.platformID) : undefined;
      return p ? (plat ? `${plat.name} · ${p.name}` : (p.name ?? "—")) : "—";
    };
  }, [plans, platforms]);
}

function tabFromParams(v: string | null): TabKey {
  return v === "reportes" ? "reportes" : "dashboard";
}

export function AdminInformesPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabFromParams(searchParams.get("pestana"));

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);

  const [vStatus, setVStatus] = useState<string>("ALL");
  const [vValidity, setVValidity] = useState<PlanValiditySegment | "all">("all");
  const [vSearch, setVSearch] = useState("");
  const [clientPeriod, setClientPeriod] = useState<ClientPeriodKey>("all");

  const planLabel = usePlanLabelResolver(plans, platforms);

  const validityRows: ValidityRowBase[] = useMemo(
    () => buildValidityRows(orders as Parameters<typeof buildValidityRows>[0], plans, platforms),
    [orders, plans, platforms],
  );

  const ordersForMetrics = useMemo(
    () =>
      orders
        .filter((o): o is OrderRow & { id: string } => Boolean(o.id))
        .map((o) => ({
          status: o.status,
          createdAt: o.createdAt,
          chosenPricePen: o.chosenPricePen,
          servicePlanID: o.servicePlanID,
        })),
    [orders],
  );

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
      setOrders((or.data ?? []) as OrderRow[]);
      setPlans((pr.data ?? []) as PlanRow[]);
      setPlatforms((plr.data ?? []) as PlatformRow[]);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== "reportes") return;
    const h = window.location.hash.replace(/^#/, "");
    if (!h) return;
    const id = window.setTimeout(() => {
      document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(id);
  }, [tab, loading]);

  function setTab(next: TabKey) {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (next === "dashboard") n.delete("pestana");
        else n.set("pestana", "reportes");
        return n;
      },
      { replace: true },
    );
  }

  const kpi = useMemo(() => kpisFromOrders(ordersForMetrics), [ordersForMetrics]);
  const barEstado = useMemo(() => barPedidosPorEstado(ordersForMetrics), [ordersForMetrics]);
  const line30 = useMemo(() => linePedidosPorDia(ordersForMetrics, 30), [ordersForMetrics]);
  const pieVig = useMemo(() => pieVigenciaAcceso(validityRows, Date.now()), [validityRows]);
  const pieIng = useMemo(
    () => pieIngresosPorAnuncio(ordersForMetrics, planLabel),
    [ordersForMetrics, planLabel],
  );

  const filteredValidityExport = useMemo(
    () => filterValidityRows(validityRows, Date.now(), vStatus, vValidity, vSearch),
    [validityRows, vStatus, vValidity, vSearch],
  );

  const sortedClientesCsvRows = useMemo((): ClientAggregateRow[] => {
    const start = periodStartMs(clientPeriod);
    const filtered = orders
      .filter((o): o is OrderRow & { id: string } => Boolean(o.id))
      .map((o) => ({
        id: o.id,
        status: o.status,
        owner: o.owner,
        payerFullName: o.payerFullName,
        chosenPricePen: o.chosenPricePen,
        createdAt: o.createdAt,
        servicePlanID: o.servicePlanID,
      }))
      .filter((o) => orderInPeriod(o, start));
    const agg = aggregateClientOrders(filtered);
    return [...agg.values()].sort((a, b) => b.orderCount - a.orderCount || b.revenuePen - a.revenuePen);
  }, [orders, clientPeriod]);

  function exportVigencia() {
    const t = Date.now();
    const rows = filterValidityRows(validityRows, t, vStatus, vValidity, vSearch);
    const lines = buildValidityCsvLines(rows, t);
    downloadUtf8Csv(`mimiplay-vigencia-pedidos-${new Date().toISOString().slice(0, 10)}.csv`, lines);
    showSnackbar(`CSV vigencia (${rows.length} filas).`, "success");
  }

  function exportClientes() {
    const lines = buildClientesCsvLines(sortedClientesCsvRows);
    const p = clientPeriod === "all" ? "todos" : `${clientPeriod}d`;
    downloadUtf8Csv(`mimiplay-clientes-${p}-${new Date().toISOString().slice(0, 10)}.csv`, lines);
    showSnackbar(`CSV clientes (${sortedClientesCsvRows.length} filas).`, "success");
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-mimi-black">Informes</h1>
      <p className="mt-2 max-w-3xl text-sm text-mimi-subtle">
        Todos los <strong className="font-bold text-mimi-black">CSV y cuadros de mando</strong> viven aquí. Las vistas
        de Pedidos, Vigencia y Clientes son solo operación; para exportar o ver tendencias usa esta sección.
      </p>

      <div className="mt-6" role="tablist" aria-label="Secciones de informes">
        <div className="inline-flex rounded-xl border border-mimi-black/12 bg-mimi-black/[0.04] p-1">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "dashboard"}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "dashboard" ? "bg-white text-mimi-black shadow-sm" : "text-mimi-muted hover:text-mimi-black"}`}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "reportes"}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "reportes" ? "bg-white text-mimi-black shadow-sm" : "text-mimi-muted hover:text-mimi-black"}`}
            onClick={() => setTab("reportes")}
          >
            Reportes
          </button>
        </div>
      </div>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-8" />}

      {!loading && tab === "dashboard" ? (
        <div className="mt-8 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-mimi-muted">Pedidos totales</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-mimi-black">{kpi.total}</p>
            </div>
            <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-mimi-muted">Entregados</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-mimi-black">{kpi.fulfilled}</p>
            </div>
            <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-mimi-muted">Cancelados</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-mimi-black">{kpi.cancelled}</p>
            </div>
            <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-mimi-muted">Ingreso S/ (entregados)</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-mimi-black">
                {kpi.revenuePen.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportBarChart data={barEstado} title="Pedidos por estado" />
            <ReportLineChart data={line30} title="Pedidos creados por día (últimos 30 días)" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ReportPieChart
              data={pieVig}
              title="Distribución de vigencia del acceso (por pedido)"
              valueLabel="Basado en fin de plan guardado en cada pedido."
            />
            <ReportPieChart
              data={pieIng}
              title="Ingresos S/ por anuncio (solo entregados)"
              valueLabel="Suma de precio elegido en pedidos entregados."
            />
          </div>
          <p className="text-xs text-mimi-muted">
            Los gráficos usan los mismos datos en vivo que el resto del admin. Botón{" "}
            <strong className="text-mimi-black">Actualizar</strong> en Reportes o recarga la página tras cambios.
          </p>
        </div>
      ) : null}

      {!loading && tab === "reportes" ? (
        <div className="mt-8 space-y-12">
          <section id="reporte-vigencia" className="scroll-mt-24 rounded-2xl border border-mimi-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-mimi-black">Vigencia por pedido</h2>
            <p className="mt-2 text-sm text-mimi-subtle">
              La tabla de seguimiento sigue en{" "}
              <Link to="/admin/pedidos?vista=vigencia" className="font-bold text-mimi-black underline">
                Pedidos → Vigencia
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-bold text-mimi-muted">
                Estado del pedido
                <select
                  className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm font-semibold"
                  value={vStatus}
                  onChange={(e) => setVStatus(e.target.value)}
                >
                  <option value="ALL">Todos</option>
                  <option value="FULFILLED">Entregado</option>
                  <option value="PAYMENT_CONFIRMED">Pago confirmado</option>
                  <option value="PAYMENT_SUBMITTED">Comprobante enviado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="AWAITING_ACCOUNT">Esperando cuenta</option>
                  <option value="MANUAL_ASSIGNMENT_NEEDED">Asignación manual</option>
                </select>
              </label>
              <label className="flex min-w-[12rem] flex-col gap-1 text-xs font-bold text-mimi-muted">
                Segmento de vigencia
                <select
                  className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm font-semibold"
                  value={vValidity}
                  onChange={(e) => setVValidity(e.target.value as PlanValiditySegment | "all")}
                >
                  <option value="all">Todos</option>
                  <option value="vigente">Vigente</option>
                  <option value="por_vencer">Por vencer (≤7 días)</option>
                  <option value="vencido">Vencido</option>
                  <option value="sin_fecha">Sin fecha de fin</option>
                </select>
              </label>
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-bold text-mimi-muted">
                Buscar (id, titular, comprador, anuncio)
                <input
                  type="search"
                  className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                  value={vSearch}
                  onChange={(e) => setVSearch(e.target.value)}
                />
              </label>
              <MimiButton variant="primary" className="!text-sm" onClick={exportVigencia}>
                Descargar CSV ({filteredValidityExport.length} filas)
              </MimiButton>
            </div>
          </section>

          <section id="reporte-clientes" className="scroll-mt-24 rounded-2xl border border-mimi-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-mimi-black">Clientes agregados</h2>
            <p className="mt-2 text-sm text-mimi-subtle">
              Agrupación por Cognito o por nombre si no hay sesión. La tabla interactiva sigue en{" "}
              <Link to="/admin/clientes" className="font-bold text-mimi-black underline">
                Clientes
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-bold text-mimi-muted">
                Periodo
                <select
                  className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm font-semibold"
                  value={clientPeriod}
                  onChange={(e) => setClientPeriod(e.target.value as ClientPeriodKey)}
                >
                  <option value="all">Todo el historial</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Últimos 12 meses</option>
                </select>
              </label>
              <MimiButton variant="primary" className="!text-sm" onClick={exportClientes}>
                Descargar CSV ({sortedClientesCsvRows.length} filas)
              </MimiButton>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
