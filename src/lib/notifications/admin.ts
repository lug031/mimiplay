import type { AdminDataClient } from "@/lib/dataClient";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import { recipientSubFromAmplifyOwner } from "@/lib/notifications/recipientSub";
import { serializeNotificationPayload, type OrderCredentialsUpdatedPayload } from "@/lib/notifications/payloads";

export type NotifyResult = { ok: true } | { ok: false; errorMessage: string };

export async function notifyOrderCredentialsUpdated(
  client: AdminDataClient,
  params: { orderOwnerField: string | null | undefined; orderId: string },
): Promise<NotifyResult> {
  const recipientSub = recipientSubFromAmplifyOwner(params.orderOwnerField);
  if (!recipientSub) {
    return {
      ok: false,
      errorMessage: "No se encontró el titular del pedido (owner); no se envió aviso al cliente.",
    };
  }
  const payload: OrderCredentialsUpdatedPayload = {
    kind: NOTIFICATION_KINDS.ORDER_CREDENTIALS_UPDATED,
    orderId: params.orderId,
  };
  const { errors } = await client.models.UserNotification.create({
    recipientSub,
    kind: NOTIFICATION_KINDS.ORDER_CREDENTIALS_UPDATED,
    title: "Credenciales actualizadas",
    body: "Actualizamos el acceso de uno de tus pedidos. Abre el detalle para ver las nuevas credenciales; la vigencia de tu plan no cambia.",
    actionPayloadJson: serializeNotificationPayload(payload),
  });
  if (errors?.length) {
    return { ok: false, errorMessage: errors.map((e) => e.message).join("; ") };
  }
  return { ok: true };
}
