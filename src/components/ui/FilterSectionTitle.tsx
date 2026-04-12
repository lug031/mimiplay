import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

export function FilterSectionTitle({ children, className = "" }: Props) {
  return (
    <p className={`text-xs font-bold uppercase tracking-wide text-mimi-muted ${className}`}>{children}</p>
  );
}
