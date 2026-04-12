import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

const tones: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-tcr-border/60 text-tcr-dark",
  info: "bg-tcr-hero-tint text-tcr-teal",
  success: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-900",
};

export function StatusBadge({ children, tone = "neutral" }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}
