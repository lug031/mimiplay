import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

const tones: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-white/10 text-white/90",
  info: "bg-white/15 text-white",
  success: "bg-emerald-500/20 text-emerald-100",
  warning: "bg-amber-500/20 text-amber-100",
  danger: "bg-red-500/20 text-red-100",
};

export function StatusBadge({ children, tone = "neutral" }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>
  );
}
