import { orderChosenOptionSummaryLine } from "@/lib/purchaseOptions";
import type { PlanValiditySegment } from "@/lib/orderPlanValidity";
import { orderPlanAccessEndAt, planValiditySegment } from "@/lib/orderPlanValidity";

export type ValidityRowBase = {
  id: string;
  status: string | null | undefined;
  owner?: string | null;
  payerFullName?: string | null;
  servicePlanID: string;
  planLabel: string;
  chosenSummary: string | null;
  chosenDurationDays: number | null;
  fulfilledAt?: string | null;
  activationStartsAt?: string | null;
  credentialRenewsAt?: string | null;
  createdAt?: string | null;
};

type PlanLike = {
  id?: string | null;
  platformID?: string | null;
  name?: string | null;
};

type PlatformLike = { id?: string | null; name?: string | null };

type OrderLike = {
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

export function buildValidityRows(
  orders: OrderLike[],
  plans: PlanLike[],
  platforms: PlatformLike[],
): ValidityRowBase[] {
  const pmap = new Map(platforms.filter((x) => x.id).map((x) => [x.id!, x]));
  const planMap = new Map(plans.filter((x) => x.id).map((x) => [x.id!, x]));
  const built: ValidityRowBase[] = [];
  for (const o of orders) {
    if (!o.id) continue;
    const p = planMap.get(o.servicePlanID);
    const plat = p?.platformID ? pmap.get(p.platformID) : undefined;
    const planLabel = p ? (plat ? `${plat.name} · ${p.name}` : (p.name ?? "—")) : "—";
    const chosenSummary =
      o.chosenOptionLabel != null && o.chosenOptionLabel !== ""
        ? orderChosenOptionSummaryLine(
            o.chosenOptionLabel,
            o.chosenDurationDays ?? null,
            o.chosenPricePen ?? null,
          )
        : null;
    built.push({
      id: o.id,
      status: o.status,
      owner: o.owner,
      payerFullName: o.payerFullName,
      servicePlanID: o.servicePlanID,
      planLabel,
      chosenSummary,
      chosenDurationDays:
        o.chosenDurationDays != null && Number.isFinite(o.chosenDurationDays)
          ? Math.floor(o.chosenDurationDays)
          : null,
      fulfilledAt: o.fulfilledAt,
      activationStartsAt: o.activationStartsAt,
      credentialRenewsAt: o.credentialRenewsAt,
      createdAt: o.createdAt,
    });
  }
  built.sort((a, b) => {
    const ae = a.credentialRenewsAt ?? "";
    const be = b.credentialRenewsAt ?? "";
    if (ae !== be) return ae.localeCompare(be);
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
  return built;
}

export function filterValidityRows(
  base: ValidityRowBase[],
  nowMs: number,
  statusFilter: string,
  validityFilter: PlanValiditySegment | "all",
  search: string,
): ValidityRowBase[] {
  const q = search.trim().toLowerCase();
  return base.filter((r) => {
    if (statusFilter !== "ALL" && (r.status ?? "") !== statusFilter) return false;
    const end = orderPlanAccessEndAt({ credentialRenewsAt: r.credentialRenewsAt });
    const seg = planValiditySegment(nowMs, end);
    if (validityFilter !== "all" && seg !== validityFilter) return false;
    if (q) {
      const hay = `${r.id} ${r.owner ?? ""} ${r.payerFullName ?? ""} ${r.planLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function validitySegmentCounts(
  rows: ValidityRowBase[],
  nowMs: number,
): Record<PlanValiditySegment, number> {
  const c: Record<PlanValiditySegment, number> = {
    sin_fecha: 0,
    vigente: 0,
    por_vencer: 0,
    vencido: 0,
  };
  for (const r of rows) {
    const end = orderPlanAccessEndAt({ credentialRenewsAt: r.credentialRenewsAt });
    const seg = planValiditySegment(nowMs, end);
    c[seg]++;
  }
  return c;
}
