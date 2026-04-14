import { useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { MimiButton } from "@/components/ui/MimiButton";
import { buildValidityRows, filterValidityRows, type ValidityRowBase } from "@/lib/adminValidityRows";
import { adminDataClient } from "@/lib/dataClient";
import {
  daysUntilPlanEnd,
  formatIsoDateTimeForDisplay,
  orderPlanAccessEndAt,
  planValiditySegment,
  PLAN_VALIDITY_LABEL,
  type PlanValiditySegment,
} from "@/lib/orderPlanValidity";
import { orderStatusBadgeTone, orderStatusLabel } from "@/lib/orderStatus";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ValidityRow = ValidityRowBase & {
  segment: PlanValiditySegment;
  daysLeft: number | null;
};

function segmentTone(s: PlanValiditySegment): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (s) {
    case "vigente":
      return "success";
    case "por_vencer":
      return "warning";
    case "vencido":
      return "danger";
    default:
      return "neutral";
  }
}

function ownerShort(owner: string | null | undefined): string {
  const t = (owner ?? "").trim();
  if (!t) return "—";
  if (t.length <= 14) return t;
  return `${t.slice(0, 10)}…`;
}

/** Panel embebido en Pedidos (pestaña Vigencia). Las exportaciones CSV están solo en Informes. */
export function AdminOrderValidityPanel() {
  const { showSnackbar } = useAdminSnackbar();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ValidityRowBase[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [validityFilter, setValidityFilter] = useState<PlanValiditySegment | "all">("all");
  const [search, setSearch] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [or, pr, plr] = await Promise.all([
        adminDataClient.models.CustomerOrder.list(),
        adminDataClient.models.ServicePlan.list(),
        adminDataClient.models.Platform.list(),
      ]);
      const built = buildValidityRows(or.data ?? [], pr.data ?? [], plr.data ?? []);
      setRows(built);
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
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo((): ValidityRow[] => {
    const now = nowTick;
    const base = filterValidityRows(rows, now, statusFilter, validityFilter, search);
    return base.map((r) => {
      const end = orderPlanAccessEndAt({ credentialRenewsAt: r.credentialRenewsAt });
      return {
        ...r,
        segment: planValiditySegment(now, end),
        daysLeft: daysUntilPlanEnd(now, end),
      };
    });
  }, [rows, nowTick, statusFilter, validityFilter, search]);

  const counts = useMemo(() => {
    const c: Record<PlanValiditySegment, number> = {
      sin_fecha: 0,
      vigente: 0,
      por_vencer: 0,
      vencido: 0,
    };
    const now = nowTick;
    for (const r of rows) {
      const end = orderPlanAccessEndAt({ credentialRenewsAt: r.credentialRenewsAt });
      const seg = planValiditySegment(now, end);
      c[seg]++;
    }
    return c;
  }, [rows, nowTick]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-mimi-black">Vigencia del acceso por pedido</h2>
          <p className="mt-2 max-w-3xl text-sm text-mimi-subtle">
            El acceso contratado vence según el <strong className="text-mimi-black">pedido</strong> (fin guardado al
            entregar). No es la vigencia de la cuenta del usuario en la web. Para{" "}
            <strong className="text-mimi-black">exportar CSV</strong> usa{" "}
            <Link
              to="/admin/informes?pestana=reportes#reporte-vigencia"
              className="font-bold text-mimi-black underline decoration-mimi-black/30 underline-offset-2"
            >
              Informes → Reportes
            </Link>
            .
          </p>
        </div>
        <MimiButton variant="outline" className="shrink-0 !text-xs sm:!text-sm" onClick={() => void load()}>
          Actualizar
        </MimiButton>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-mimi-subtle">
        <span className="rounded-full bg-mimi-black/[0.06] px-3 py-1">
          Vigentes: <strong className="text-mimi-black">{counts.vigente}</strong>
        </span>
        <span className="rounded-full bg-amber-100/80 px-3 py-1 text-amber-950">
          Por vencer: <strong>{counts.por_vencer}</strong>
        </span>
        <span className="rounded-full bg-red-100/80 px-3 py-1 text-red-950">
          Vencidos: <strong>{counts.vencido}</strong>
        </span>
        <span className="rounded-full bg-mimi-black/[0.06] px-3 py-1">
          Sin fecha de fin: <strong className="text-mimi-black">{counts.sin_fecha}</strong>
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-bold text-mimi-muted">
          Estado del pedido
          <select
            className="rounded-lg border border-mimi-black/15 bg-white px-3 py-2 text-sm font-semibold text-mimi-black"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
          Vigencia del acceso
          <select
            className="rounded-lg border border-mimi-black/15 bg-white px-3 py-2 text-sm font-semibold text-mimi-black"
            value={validityFilter}
            onChange={(e) => setValidityFilter(e.target.value as PlanValiditySegment | "all")}
          >
            <option value="all">Todas</option>
            <option value="vigente">{PLAN_VALIDITY_LABEL.vigente}</option>
            <option value="por_vencer">{PLAN_VALIDITY_LABEL.por_vencer}</option>
            <option value="vencido">{PLAN_VALIDITY_LABEL.vencido}</option>
            <option value="sin_fecha">{PLAN_VALIDITY_LABEL.sin_fecha}</option>
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-bold text-mimi-muted">
          Buscar
          <input
            type="search"
            placeholder="Id, titular, comprador, anuncio…"
            className="rounded-lg border border-mimi-black/15 px-3 py-2 text-sm text-mimi-black placeholder:text-mimi-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <MimiLoadingState tone="light" layout="inline" className="mt-10" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-mimi-black/10 bg-white shadow-sm">
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-mimi-black/10 bg-mimi-black/[0.03] text-xs font-extrabold uppercase tracking-wide text-mimi-muted">
                <th className="px-3 py-3">Pedido</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Vigencia acceso</th>
                <th className="px-3 py-3">Fin plan (pedido)</th>
                <th className="px-3 py-3">Días</th>
                <th className="px-3 py-3">Titular</th>
                <th className="px-3 py-3">Comprador</th>
                <th className="px-3 py-3">Anuncio</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-mimi-muted">
                    No hay pedidos con estos filtros.
                  </td>
                </tr>
              ) : null}
              {filtered.map((r) => {
                const endAt = orderPlanAccessEndAt({ credentialRenewsAt: r.credentialRenewsAt });
                return (
                  <tr key={r.id} className="border-b border-mimi-black/[0.06] last:border-0 hover:bg-mimi-black/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-mimi-black">{r.id.slice(0, 8)}…</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={orderStatusBadgeTone(r.status)} variant="onLight">
                        {orderStatusLabel(r.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={segmentTone(r.segment)} variant="onLight">
                        {PLAN_VALIDITY_LABEL[r.segment]}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-mimi-black">{formatIsoDateTimeForDisplay(endAt)}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums text-mimi-black">
                      {r.daysLeft == null ? "—" : r.daysLeft < 0 ? `${r.daysLeft}` : `${r.daysLeft}`}
                    </td>
                    <td className="max-w-[8rem] truncate px-3 py-2.5 text-xs text-mimi-black" title={r.owner ?? ""}>
                      {ownerShort(r.owner)}
                    </td>
                    <td className="max-w-[9rem] truncate px-3 py-2.5 text-xs text-mimi-black" title={r.payerFullName ?? ""}>
                      {r.payerFullName?.trim() || "—"}
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-2.5 text-xs text-mimi-black" title={r.planLabel}>
                      {r.planLabel}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        to={`/admin/pedidos?order=${encodeURIComponent(r.id)}`}
                        className="text-xs font-bold text-mimi-black underline decoration-mimi-black/25 underline-offset-2 hover:decoration-mimi-black"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
