const LOGO_ICON = "/logo-icono.png";

/**
 * Botón flotante de ayuda (solo UI). De momento no abre ningún panel hasta integrar el chat.
 */
export function MimiPlayFloatingChat() {
  return (
    <button
      type="button"
      disabled
      title="Próximamente"
      aria-label="Ayuda MimiPlay (próximamente)"
      className="fixed bottom-5 right-4 z-[70] flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full border-2 border-white/20 bg-mimi-elevated opacity-75 shadow-xl shadow-black/40 sm:bottom-6 sm:right-6 sm:h-[3.75rem] sm:w-[3.75rem]"
    >
      <img src={LOGO_ICON} alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" decoding="async" />
    </button>
  );
}
