import type { ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

const pad: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5 sm:p-6",
};

type Props = {
  children: ReactNode;
  className?: string;
  padding?: Padding;
  /** Tarjeta clara sobre fondo oscuro (p. ej. listados de catálogo) */
  variant?: "dark" | "light";
};

export function MimiCard({ children, className = "", padding = "md", variant = "dark" }: Props) {
  const base =
    variant === "dark"
      ? "rounded-mimi border border-white/10 bg-mimi-elevated shadow-sm"
      : "rounded-mimi border border-neutral-200 bg-white text-neutral-900 shadow-md";

  return <div className={`${base} ${pad[padding]} ${className}`}>{children}</div>;
}
