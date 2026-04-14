/** Etiquetas para UI (valores reales = enum en Amplify). */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  AWAITING_PAYMENT: "Esperando pago",
  PAYMENT_SUBMITTED: "Comprobante enviado",
  PAYMENT_CONFIRMED: "Pago confirmado",
  AWAITING_ACCOUNT: "Esperando cuenta",
  AUTO_MATCH_PROPOSED: "Asignación automática propuesta",
  AWAITING_ADMIN_CONFIRM: "Pendiente confirmación admin",
  FULFILLED: "Entregado",
  CANCELLED: "Cancelado",
  MANUAL_ASSIGNMENT_NEEDED: "Requiere asignación manual",
};

export function orderStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return ORDER_STATUS_LABEL[status] ?? status;
}

/** Tono de badge alineado con el significado del estado (lista pedidos, admin, etc.). */
export function orderStatusBadgeTone(
  status: string | null | undefined,
): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "FULFILLED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "PAYMENT_SUBMITTED":
      return "warning";
    case "PAYMENT_CONFIRMED":
    case "AWAITING_ACCOUNT":
      return "info";
    default:
      return "neutral";
  }
}

export const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservada",
  ASSIGNED: "Asignada",
  EXPIRED: "Vencida",
  DISABLED: "Deshabilitada",
};

export function accountStatusLabel(s: string | null | undefined): string {
  if (!s) return "—";
  return ACCOUNT_STATUS_LABEL[s] ?? s;
}

export const CATEGORY_LABEL: Record<string, string> = {
  STREAMING: "Streaming",
  SPORTS: "Deportes / TV",
  PC_APP: "Apps PC",
  OTHER: "Otros",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  YAPE_PLIN: "Yape | Plin",
  YAPE: "Pago móvil (A)",
  PLIN: "Pago móvil (B)",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

export function paymentMethodLabel(code: string | null | undefined): string {
  if (!code) return "";
  return PAYMENT_METHOD_LABEL[code] ?? code;
}

export const CLAIM_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  ATTENDED: "Atendido",
};

export function claimStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return CLAIM_STATUS_LABEL[status] ?? status;
}

export function claimStatusBadgeTone(
  status: string | null | undefined,
): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "ATTENDED":
      return "success";
    case "PENDING":
      return "warning";
    default:
      return "neutral";
  }
}
