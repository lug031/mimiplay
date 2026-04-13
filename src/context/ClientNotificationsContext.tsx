import { useClientAuth } from "@/auth/ClientAuthContext";
import { dataClient } from "@/lib/dataClient";
import { parseNotificationPayload, notificationDetailPath } from "@/lib/notifications/payloads";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ClientNotificationItem = {
  id: string;
  recipientSub?: string | null;
  kind: string;
  title: string;
  body: string;
  readAt?: string | null;
  actionPayloadJson?: string | null;
  createdAt?: string | null;
};

type ClientNotificationsContextValue = {
  /** Suscripción activa (usuario cliente autenticado, no staff). */
  enabled: boolean;
  loading: boolean;
  items: ClientNotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  detailPathFor: (item: ClientNotificationItem) => string | null;
};

const ClientNotificationsContext = createContext<ClientNotificationsContextValue | null>(null);

export function ClientNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isStaffAdmin } = useClientAuth();
  const enabled = Boolean(user?.userId) && !isStaffAdmin;

  const [loading, setLoading] = useState(enabled);
  const [items, setItems] = useState<ClientNotificationItem[]>([]);

  useEffect(() => {
    if (!enabled || !user?.userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const uid = user.userId;
    setLoading(true);
    const sub = dataClient.models.UserNotification.observeQuery().subscribe({
      next: ({ items: raw }) => {
        const mapped = (raw as ClientNotificationItem[])
          .filter((n) => n.id && (!n.recipientSub || n.recipientSub === uid))
          .slice()
          .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        setItems(mapped);
        setLoading(false);
      },
      error: () => {
        setLoading(false);
      },
    });

    return () => sub.unsubscribe();
  }, [enabled, user?.userId]);

  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
    const { errors } = await dataClient.models.UserNotification.update({
      id,
      readAt: new Date().toISOString(),
    });
    if (errors?.length) {
      console.error(errors.map((e) => e.message).join("; "));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = items.filter((n) => !n.readAt);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  }, [items, markAsRead]);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  const detailPathFor = useCallback((item: ClientNotificationItem): string | null => {
    const payload = parseNotificationPayload(item.actionPayloadJson);
    return notificationDetailPath(payload);
  }, []);

  const value = useMemo<ClientNotificationsContextValue>(
    () => ({
      enabled,
      loading,
      items,
      unreadCount,
      markAsRead,
      markAllAsRead,
      detailPathFor,
    }),
    [enabled, loading, items, unreadCount, markAsRead, markAllAsRead, detailPathFor],
  );

  return <ClientNotificationsContext.Provider value={value}>{children}</ClientNotificationsContext.Provider>;
}

export function useClientNotifications(): ClientNotificationsContextValue {
  const ctx = useContext(ClientNotificationsContext);
  if (!ctx) {
    throw new Error("useClientNotifications debe usarse dentro de ClientNotificationsProvider");
  }
  return ctx;
}
