import { useCallback, useEffect, useId, useState } from "react";

const LOGO_ICON = "/logo-icono.png";

/**
 * Botón flotante (icono de marca) + panel de chat solo UI, sin integración aún.
 */
export function MimiPlayFloatingChat() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${panelId}-title`}
          className="fixed bottom-24 right-4 z-[60] flex max-h-[min(32rem,calc(100dvh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-mimi border border-white/12 bg-mimi-surface text-left shadow-2xl shadow-black/50 sm:bottom-28 sm:right-6"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3.5">
            <div className="min-w-0">
              <h2 id={`${panelId}-title`} className="truncate text-sm font-extrabold text-white">
                Soporte MimiPlay
              </h2>
              <p className="truncate text-[11px] text-white/45">Respuestas automáticas próximamente</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mimi text-lg leading-none text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-1">
            <div className="flex justify-start">
              <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-mimi-black px-3.5 py-2.5 text-sm leading-relaxed text-white/80">
                Hola. Aquí podrás resolver dudas sobre planes, pagos con comprobante y el estado de tus pedidos. Por ahora este
                canal es solo de demostración.
              </div>
            </div>
          </div>

          <footer className="shrink-0 p-3 pt-1">
            <div className="flex items-end gap-2 rounded-mimi bg-mimi-black/90 p-1.5 pl-3">
              <label htmlFor={`${panelId}-input`} className="sr-only">
                Mensaje
              </label>
              <textarea
                id={`${panelId}-input`}
                rows={1}
                readOnly
                placeholder="Escribe tu mensaje…"
                className="max-h-24 min-h-[2.5rem] w-full resize-none bg-transparent py-2 text-sm text-white/90 placeholder:text-white/35 outline-none"
              />
              <button
                type="button"
                disabled
                className="shrink-0 rounded-mimi bg-white/90 px-3 py-2 text-xs font-extrabold text-mimi-black opacity-50"
                aria-disabled="true"
              >
                Enviar
              </button>
            </div>
          </footer>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/25 bg-mimi-elevated shadow-xl shadow-black/40 transition hover:border-white/40 hover:bg-mimi-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:bottom-6 sm:right-6 sm:h-[3.75rem] sm:w-[3.75rem]"
        aria-label={open ? "Cerrar ayuda" : "Abrir ayuda MimiPlay"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <img src={LOGO_ICON} alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" decoding="async" />
      </button>
    </>
  );
}
