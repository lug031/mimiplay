/** Valores del enum `UserNotification.kind` en el esquema; ampliar aquí al añadir tipos en Amplify. */
export const NOTIFICATION_KINDS = {
  ORDER_CREDENTIALS_UPDATED: "ORDER_CREDENTIALS_UPDATED",
} as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[keyof typeof NOTIFICATION_KINDS];
