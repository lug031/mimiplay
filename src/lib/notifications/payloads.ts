import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";

export type OrderCredentialsUpdatedPayload = {
  kind: typeof NOTIFICATION_KINDS.ORDER_CREDENTIALS_UPDATED;
  orderId: string;
};

export type NotificationActionPayload = OrderCredentialsUpdatedPayload;

export function serializeNotificationPayload(payload: NotificationActionPayload): string {
  return JSON.stringify(payload);
}

export function parseNotificationPayload(json: string | null | undefined): NotificationActionPayload | null {
  if (!json?.trim()) return null;
  try {
    const v = JSON.parse(json) as unknown;
    if (!v || typeof v !== "object") return null;
    const kind = (v as { kind?: string }).kind;
    if (kind === NOTIFICATION_KINDS.ORDER_CREDENTIALS_UPDATED) {
      const orderId = (v as { orderId?: string }).orderId;
      if (typeof orderId === "string" && orderId.length > 0) {
        return { kind: NOTIFICATION_KINDS.ORDER_CREDENTIALS_UPDATED, orderId };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function notificationDetailPath(payload: NotificationActionPayload | null): string | null {
  if (!payload) return null;
  if (payload.kind === NOTIFICATION_KINDS.ORDER_CREDENTIALS_UPDATED) {
    return `/app/pedidos/${payload.orderId}`;
  }
  return null;
}
