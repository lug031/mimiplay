import { orderStatusLabel } from "@/lib/orderStatus";
import { PLAN_VALIDITY_LABEL, type PlanValiditySegment } from "@/lib/orderPlanValidity";
import type { ValidityRowBase } from "@/lib/adminValidityRows";
import { validitySegmentCounts } from "@/lib/adminValidityRows";

export type BarDatum = { name: string; value: number };
export type LineDatum = { label: string; value: number };
export type PieDatum = { name: string; value: number; color: string };

const PIE_COLORS = ["#008ba3", "#802d7d", "#e31b5d", "#0a0a0a", "#737373", "#a3a3a3", "#1a1a1a"];

type OrderLite = {
  status?: string | null;
  createdAt?: string | null;
  chosenPricePen?: number | null;
  servicePlanID: string;
};

export function barPedidosPorEstado(orders: OrderLite[]): BarDatum[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const s = o.status ?? "—";
    map.set(s, (map.get(s) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([code, value]) => ({ name: orderStatusLabel(code), value }))
    .sort((a, b) => b.value - a.value);
}

export function linePedidosPorDia(orders: OrderLite[], days: number): LineDatum[] {
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const counts = new Map(dayKeys.map((k) => [k, 0]));
  for (const o of orders) {
    const c = o.createdAt?.trim().slice(0, 10);
    if (c && counts.has(c)) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return dayKeys.map((key) => {
    const d = new Date(key + "T12:00:00");
    return {
      label: d.toLocaleDateString("es-PE", { month: "short", day: "numeric" }),
      value: counts.get(key) ?? 0,
    };
  });
}

export function pieIngresosPorAnuncio(
  orders: OrderLite[],
  planLabel: (servicePlanID: string) => string,
): PieDatum[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.status !== "FULFILLED") continue;
    const pen = o.chosenPricePen;
    if (pen == null || !Number.isFinite(pen) || pen <= 0) continue;
    const label = planLabel(o.servicePlanID);
    map.set(label, (map.get(label) ?? 0) + pen);
  }
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return [];
  const top = 5;
  const head = entries.slice(0, top);
  const tail = entries.slice(top);
  const rest = tail.reduce((s, [, v]) => s + v, 0);
  const pie: PieDatum[] = head.map(([name, value], i) => ({
    name: name.length > 28 ? `${name.slice(0, 26)}…` : name,
    value: Math.round(value * 100) / 100,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  if (rest > 0.01) {
    pie.push({
      name: "Otros anuncios",
      value: Math.round(rest * 100) / 100,
      color: PIE_COLORS[pie.length % PIE_COLORS.length],
    });
  }
  return pie;
}

export function pieVigenciaAcceso(validityRows: ValidityRowBase[], nowMs: number): PieDatum[] {
  const c = validitySegmentCounts(validityRows, nowMs);
  const order: PlanValiditySegment[] = ["vigente", "por_vencer", "vencido", "sin_fecha"];
  const raw = order.map((seg, i) => ({
    name: PLAN_VALIDITY_LABEL[seg],
    value: c[seg],
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  const filtered = raw.filter((d) => d.value > 0);
  return filtered.length ? filtered : [];
}

export function kpisFromOrders(orders: OrderLite[]): {
  total: number;
  fulfilled: number;
  revenuePen: number;
  cancelled: number;
} {
  let fulfilled = 0;
  let cancelled = 0;
  let revenuePen = 0;
  for (const o of orders) {
    if (o.status === "FULFILLED") {
      fulfilled += 1;
      const pen = o.chosenPricePen;
      if (pen != null && Number.isFinite(pen)) revenuePen += pen;
    } else if (o.status === "CANCELLED") cancelled += 1;
  }
  return { total: orders.length, fulfilled, revenuePen, cancelled };
}
