import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

type Props = {
  children: ReactNode;
  tone?: Tone;
  /** `onDark`: área cliente / fondos oscuros. `onLight`: admin y superficies blancas. */
  variant?: "onDark" | "onLight";
};

const tonesOnDark: Record<Tone, string> = {
  neutral: "bg-white/10 text-white/90",
  info: "bg-white/15 text-white",
  success: "bg-emerald-500/20 text-emerald-100",
  warning: "bg-amber-500/20 text-amber-100",
  danger: "bg-red-500/20 text-red-100",
};

const tonesOnLight: Record<Tone, string> = {
  neutral: "bg-mimi-black/[0.08] text-mimi-black",
  info: "bg-sky-100 text-sky-950",
  success: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-950",
  danger: "bg-red-100 text-red-900",
};

export function StatusBadge({ children, tone = "neutral", variant = "onDark" }: Props) {
  const palette = variant === "onLight" ? tonesOnLight : tonesOnDark;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${palette[tone]}`}>{children}</span>
  );
}
