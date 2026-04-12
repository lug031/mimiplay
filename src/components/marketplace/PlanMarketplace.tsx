import { useMemo, useState } from "react";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import type { PlanRow } from "@/lib/catalogApi";
import { isEventCardPresentation, planRowHasRichMarketing } from "@/lib/planMarketing";
import { CatalogBanner } from "./CatalogBanner";
import { CatalogFiltersSidebar } from "./CatalogFiltersSidebar";
import { PlanOfferCard } from "./PlanOfferCard";

function uniquePlatforms(plans: PlanRow[]) {
  const names = [...new Set(plans.map((p) => p.platformName))];
  names.sort((a, b) => a.localeCompare(b));
  return names;
}

type Props = {
  plans: PlanRow[];
  loading: boolean;
  error: string | null;
  /** `opcion` se añade a la URL cuando el anuncio tiene varias opciones o una opción explícita en JSON. */
  buildCtaTo: (planId: string, optionId?: string) => string;
  ctaLabel?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  searchText?: string;
  catalogChrome?: boolean;
};

export function PlanMarketplace({
  plans,
  loading,
  error,
  buildCtaTo,
  ctaLabel = "Comprar acceso",
  bannerTitle = "Catálogo de anuncios",
  bannerSubtitle =
    "Anuncios por plataforma y categoría. Al elegir uno, formaliza el pago con comprobante; te damos seguimiento cuando quede validado.",
  searchText = "",
  catalogChrome = false,
}: Props) {
  const [platformKey, setPlatformKey] = useState<string>("all");
  const [categoryKey, setCategoryKey] = useState<string>("all");
  const [shortOnly, setShortOnly] = useState(false);
  const [budgetOnly, setBudgetOnly] = useState(false);
  const [toggleImmediate, setToggleImmediate] = useState(true);
  const [toggleId, setToggleId] = useState(false);
  const [toggleInvoice, setToggleInvoice] = useState(false);
  const [richFichaOnly, setRichFichaOnly] = useState(false);
  const [eventsOnly, setEventsOnly] = useState(false);

  const platforms = useMemo(() => uniquePlatforms(plans), [plans]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return plans.filter((p) => {
      if (platformKey !== "all" && p.platformName !== platformKey) return false;
      const planCat = p.category ?? "OTHER";
      if (categoryKey !== "all" && planCat !== categoryKey) return false;
      if (shortOnly && p.durationDays > 30) return false;
      if (budgetOnly && p.pricePen >= 25) return false;
      if (q) {
        const haystack = `${p.platformName} ${p.planName} ${p.cardTitle ?? ""} ${p.extraContent ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (richFichaOnly && !planRowHasRichMarketing(p)) return false;
      if (eventsOnly && !isEventCardPresentation(p)) return false;
      return true;
    });
  }, [plans, platformKey, categoryKey, shortOnly, budgetOnly, searchText, richFichaOnly, eventsOnly]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className={`shrink-0 space-y-5 ${catalogChrome ? "lg:w-[28%] lg:min-w-[240px]" : "lg:w-72"}`}>
        <CatalogFiltersSidebar
          catalogChrome={catalogChrome}
          platforms={platforms}
          platformKey={platformKey}
          setPlatformKey={setPlatformKey}
          categoryKey={categoryKey}
          setCategoryKey={setCategoryKey}
          shortOnly={shortOnly}
          setShortOnly={setShortOnly}
          budgetOnly={budgetOnly}
          setBudgetOnly={setBudgetOnly}
          toggleImmediate={toggleImmediate}
          setToggleImmediate={setToggleImmediate}
          toggleId={toggleId}
          setToggleId={setToggleId}
          toggleInvoice={toggleInvoice}
          setToggleInvoice={setToggleInvoice}
          richFichaOnly={richFichaOnly}
          setRichFichaOnly={setRichFichaOnly}
          eventsOnly={eventsOnly}
          setEventsOnly={setEventsOnly}
        />
      </aside>

      <div className="min-w-0 flex-1">
        <CatalogBanner title={bannerTitle} subtitle={bannerSubtitle} gridDecor={catalogChrome} />

        {loading && (
          <MimiLoadingState tone={catalogChrome ? "surface" : "dark"} layout="inline" className="mt-8" />
        )}
        {error && (
          <div className="mt-8 rounded-mimi border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        {!loading && !error && plans.length === 0 && (
          <p className="mt-8 text-sm text-mimi-muted">Aún no hay anuncios en el catálogo.</p>
        )}
        {!loading && !error && plans.length > 0 && filtered.length === 0 && (
          <p className="mt-8 text-sm text-mimi-muted">No hay anuncios con estos filtros. Prueba otra categoría o quita filtros.</p>
        )}

        <div
          className={
            catalogChrome
              ? "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5 lg:gap-6 xl:grid-cols-3 xl:gap-6 items-stretch"
              : "mt-6 flex flex-col gap-4"
          }
        >
          {filtered.map((p) => (
            <PlanOfferCard
              key={p.planId}
              plan={p}
              buildCtaTo={buildCtaTo}
              ctaLabel={ctaLabel}
              catalogChrome={catalogChrome}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
