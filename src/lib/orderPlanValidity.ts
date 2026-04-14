/**
 * Vigencia del **plan contratado en el pedido** (no del usuario).
 * Al entregar, `credentialRenewsAt` guarda el fin de acceso; inicio en `activationStartsAt` / `fulfilledAt`.
 */

export type PlanValiditySegment = "sin_fecha" | "vigente" | "por_vencer" | "vencido";

const MS_PER_DAY = 86_400_000;

/** Fin de vigencia del acceso en este pedido (misma semántica que en entrega admin). */
export function orderPlanAccessEndAt(order: { credentialRenewsAt?: string | null }): string | null {
  const t = order.credentialRenewsAt?.trim();
  return t || null;
}

export function orderPlanAccessStartAt(order: {
  activationStartsAt?: string | null;
  fulfilledAt?: string | null;
}): string | null {
  const a = order.activationStartsAt?.trim();
  if (a) return a;
  return order.fulfilledAt?.trim() || null;
}

export function planValiditySegment(
  nowMs: number,
  endAtIso: string | null,
  options?: { warnDays?: number },
): PlanValiditySegment {
  if (!endAtIso) return "sin_fecha";
  const end = Date.parse(endAtIso);
  if (!Number.isFinite(end)) return "sin_fecha";
  if (nowMs >= end) return "vencido";
  const warnDays = options?.warnDays ?? 7;
  if (end - nowMs <= warnDays * MS_PER_DAY) return "por_vencer";
  return "vigente";
}

/** Días hasta el fin (negativo si ya venció). */
export function daysUntilPlanEnd(nowMs: number, endAtIso: string | null): number | null {
  if (!endAtIso) return null;
  const end = Date.parse(endAtIso);
  if (!Number.isFinite(end)) return null;
  return Math.ceil((end - nowMs) / MS_PER_DAY);
}

export const PLAN_VALIDITY_LABEL: Record<PlanValiditySegment, string> = {
  sin_fecha: "Sin fecha de fin",
  vigente: "Vigente",
  por_vencer: "Por vencer (≤7 días)",
  vencido: "Vencido",
};

export function formatIsoDateTimeForDisplay(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Fila CSV con comillas si hace falta. */
export function csvEscapeCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(csvEscapeCell).join(",");
}
