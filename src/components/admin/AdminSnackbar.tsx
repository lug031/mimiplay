/* eslint-disable react-refresh/only-export-components -- context + hook + util en un solo módulo admin */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AdminSnackbarVariant = "success" | "error" | "warning" | "info";

type SnackbarItem = {
  id: string;
  message: string;
  variant: AdminSnackbarVariant;
};

const DEFAULT_DURATION_MS = 6000;
const MAX_VISIBLE = 5;

type Ctx = {
  showSnackbar: (message: string, variant?: AdminSnackbarVariant, durationMs?: number) => string;
  dismissSnackbar: (id: string) => void;
};

const AdminSnackbarContext = createContext<Ctx | null>(null);

const variantClass: Record<AdminSnackbarVariant, string> = {
  success: "border-emerald-500/40 bg-emerald-950 text-emerald-50 shadow-emerald-950/40",
  error: "border-red-500/40 bg-red-950 text-red-50 shadow-red-950/40",
  warning: "border-amber-500/45 bg-amber-950 text-amber-50 shadow-amber-950/40",
  info: "border-white/20 bg-mimi-elevated text-white shadow-black/40",
};

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdminSnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([]);

  const dismissSnackbar = useCallback((id: string) => {
    setItems((s) => s.filter((x) => x.id !== id));
  }, []);

  const showSnackbar = useCallback(
    (message: string, variant: AdminSnackbarVariant = "info", durationMs: number = DEFAULT_DURATION_MS) => {
      const id = newId();
      const trimmed = message.trim();
      if (!trimmed) return id;
      setItems((s) => [...s.slice(-(MAX_VISIBLE - 1)), { id, message: trimmed, variant }]);
      if (durationMs > 0) {
        window.setTimeout(() => dismissSnackbar(id), durationMs);
      }
      return id;
    },
    [dismissSnackbar],
  );

  const value = useMemo(() => ({ showSnackbar, dismissSnackbar }), [showSnackbar, dismissSnackbar]);

  return (
    <AdminSnackbarContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-[200] flex w-full max-w-md flex-col gap-2 p-3 sm:bottom-4 sm:right-4 sm:p-4"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold leading-snug shadow-lg ${variantClass[item.variant]}`}
          >
            <span className="min-w-0 flex-1 break-words">{item.message}</span>
            <button
              type="button"
              className="shrink-0 rounded-lg px-1.5 py-0.5 text-lg leading-none text-current opacity-80 hover:bg-white/10 hover:opacity-100"
              aria-label="Cerrar aviso"
              onClick={() => dismissSnackbar(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AdminSnackbarContext.Provider>
  );
}

export function useAdminSnackbar() {
  const ctx = useContext(AdminSnackbarContext);
  if (!ctx) {
    throw new Error("useAdminSnackbar debe usarse dentro de AdminSnackbarProvider (portal /admin).");
  }
  return ctx;
}

/** Heurística para mensajes de API (p. ej. permisos Cognito). */
export function snackbarVariantForMessage(message: string): AdminSnackbarVariant {
  if (/permiso|unauthorized|not authorized|denied|acceso denegado/i.test(message)) return "warning";
  if (/error|falló|no se pudo|inválid|obligator/i.test(message)) return "error";
  if (/creado|guardad|confirmad|entregad|actualiz|eliminad|activad|desactivad|cancelad/i.test(message)) return "success";
  return "info";
}
