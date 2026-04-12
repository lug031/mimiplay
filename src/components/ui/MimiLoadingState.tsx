export type MimiLoadingTone = "dark" | "light" | "surface";

type Props = {
  tone?: MimiLoadingTone;
  /** Pantalla completa (auth), bloque centrado (portal) o compacto (listas/modales). */
  layout?: "fullscreen" | "viewport" | "inline";
  className?: string;
  "aria-label"?: string;
};

const tone = {
  dark: {
    root: "bg-mimi-black text-mimi-muted",
    ring: "border-white/20 border-t-white",
  },
  light: {
    root: "bg-transparent text-neutral-500",
    ring: "border-neutral-300 border-t-neutral-800",
  },
  /** Sobre `bg-mimi-surface` u otros fondos oscuros que no sean negro puro. */
  surface: {
    root: "bg-transparent text-mimi-muted",
    ring: "border-white/20 border-t-white",
  },
} as const;

export function MimiLoadingState({
  tone: toneKey = "dark",
  layout = "viewport",
  className = "",
  "aria-label": ariaLabel = "Cargando",
}: Props) {
  const t = tone[toneKey];
  const layoutCls =
    layout === "fullscreen"
      ? "min-h-screen w-full"
      : layout === "viewport"
        ? "min-h-[40vh] w-full"
        : "w-full py-12";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 font-manrope ${t.root} ${layoutCls} ${className}`.trim()}
      role="status"
      aria-label={ariaLabel}
    >
      <div className={`h-9 w-9 shrink-0 animate-spin rounded-full border-2 ${t.ring}`} aria-hidden />
      <p className="text-sm font-medium">Cargando…</p>
    </div>
  );
}
