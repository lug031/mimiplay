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
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px),
              linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-sm font-extrabold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/65 sm:text-sm">{subtitle}</p>
        </div>
      </MimiCard>
    );
  }

  return (
    <MimiCard variant="dark" padding="md">
      <p className="text-sm font-extrabold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/65 sm:text-sm">{subtitle}</p>
    </MimiCard>
  );
}
