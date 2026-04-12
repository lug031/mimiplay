import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-mimi-black shadow-sm transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
  secondary:
    "rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
  ghost:
    "rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Si está definido, se renderiza como `Link` en lugar de `button`. */
  to?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function MimiButton({ children, variant = "primary", className = "", to, type = "button", ...rest }: Props) {
  const cls = `inline-flex items-center justify-center text-center ${styles[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
