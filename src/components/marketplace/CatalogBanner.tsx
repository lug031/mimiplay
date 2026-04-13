import { MimiCard } from "@/components/ui/MimiCard";

type Props = {
  title: string;
  subtitle: string;
  /** Rejilla decorativa tipo “mapa” */
  gridDecor?: boolean;
};

export function CatalogBanner({ title, subtitle, gridDecor }: Props) {
  if (gridDecor) {
    return (
      <MimiCard variant="dark" padding="lg" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px),
              linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative">
          <p className="text-sm font-extrabold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-mimi-muted sm:text-sm">{subtitle}</p>
        </div>
      </MimiCard>
    );
  }

  return (
    <MimiCard variant="dark" padding="md">
      <p className="text-sm font-extrabold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-mimi-muted sm:text-sm">{subtitle}</p>
    </MimiCard>
  );
}
