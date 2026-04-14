import {
  csvRow,
  daysUntilPlanEnd,
  orderPlanAccessEndAt,
  orderPlanAccessStartAt,
  planValiditySegment,
  PLAN_VALIDITY_LABEL,
} from "@/lib/orderPlanValidity";
import { orderStatusLabel } from "@/lib/orderStatus";
import type { ValidityRowBase } from "@/lib/adminValidityRows";
import type { ClientAggregateRow } from "@/lib/adminClientesAggregate";

export function downloadUtf8Csv(filename: string, lines: string[]): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildValidityCsvLines(rows: ValidityRowBase[], nowMs: number): string[] {
  const headers = [
    "id_pedido",
    "estado",
    "titular_sub",
    "comprador",
    "anuncio",
    "opcion_resumen",
    "dias_contratados",
    "inicio_vigencia",
    "fin_vigencia_pedido",
    "segmento_vigencia",
    "dias_hasta_fin",
    "creado",
  ];
  const lines = [csvRow(headers)];
  for (const r of rows) {
    const endAt = orderPlanAccessEndAt({ credentialRenewsAt: r.credentialRenewsAt });
    const startAt = orderPlanAccessStartAt({
      activationStartsAt: r.activationStartsAt,
      fulfilledAt: r.fulfilledAt,
    });
    const seg = planValiditySegment(nowMs, endAt);
    lines.push(
      csvRow([
        r.id,
        orderStatusLabel(r.status),
        r.owner ?? "",
        r.payerFullName ?? "",
        r.planLabel,
        r.chosenSummary ?? "",
        r.chosenDurationDays ?? "",
        startAt ?? "",
        endAt ?? "",
        PLAN_VALIDITY_LABEL[seg],
        daysUntilPlanEnd(nowMs, endAt) ?? "",
        r.createdAt ?? "",
      ]),
    );
  }
  return lines;
}

export function buildClientesCsvLines(rows: ClientAggregateRow[]): string[] {
  const headers = [
    "titular_cognito_sub",
    "nombre_comprador_reciente",
    "cuenta_web",
    "pedidos_periodo",
    "entregados",
    "en_proceso",
    "cancelados",
    "ingreso_soles_entregados",
    "ticket_medio_entregados",
    "primera_compra",
    "ultima_compra",
    "ultimo_pedido_id",
  ];
  const lines = [csvRow(headers)];
  for (const r of rows) {
    const ticket = r.fulfilledCount > 0 ? (r.revenuePen / r.fulfilledCount).toFixed(2) : "";
    lines.push(
      csvRow([
        r.hasCognitoOwner ? r.ownerSub : "",
        r.payerLabel,
        r.hasCognitoOwner ? "Sí" : "No (agrupado por nombre)",
        r.orderCount,
        r.fulfilledCount,
        r.inProgressCount,
        r.cancelledCount,
        r.revenuePen.toFixed(2),
        ticket,
        r.firstOrderAt ?? "",
        r.lastOrderAt ?? "",
        r.lastOrderId,
      ]),
    );
  }
  return lines;
}
