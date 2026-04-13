import { MimiCard } from "@/components/ui/MimiCard";
import { FilterPills } from "@/components/ui/FilterPills";
import { FilterSectionTitle } from "@/components/ui/FilterSectionTitle";
import { FilterSwitchRow } from "@/components/ui/FilterSwitchRow";
import { CATEGORY_LABEL } from "@/lib/orderStatus";

type Props = {
  catalogChrome: boolean;
  platforms: string[];
  platformKey: string;
  setPlatformKey: (k: string) => void;
  categoryKey: string;
  setCategoryKey: (k: string) => void;
  catalogShowAnuncios: boolean;
  setCatalogShowAnuncios: (v: boolean) => void;
  catalogShowEventos: boolean;
  setCatalogShowEventos: (v: boolean) => void;
  shortOnly: boolean;
  setShortOnly: (v: boolean) => void;
  budgetOnly: boolean;
  setBudgetOnly: (v: boolean) => void;
  richFichaOnly: boolean;
  setRichFichaOnly: (v: boolean) => void;
  eventsOnly: boolean;
  setEventsOnly: (v: boolean) => void;
};

export function CatalogFiltersSidebar({
  catalogChrome,
  platforms,
  platformKey,
  setPlatformKey,
  categoryKey,
  setCategoryKey,
  catalogShowAnuncios,
  setCatalogShowAnuncios,
  catalogShowEventos,
  setCatalogShowEventos,
  shortOnly,
  setShortOnly,
  budgetOnly,
  setBudgetOnly,
  richFichaOnly,
  setRichFichaOnly,
  eventsOnly,
  setEventsOnly,
}: Props) {
  const pillItems = [{ key: "all", label: "Todo" }, ...platforms.map((name) => ({ key: name, label: name }))];

  return (
    <>
      <MimiCard variant="dark">
        <FilterSectionTitle>Plataforma</FilterSectionTitle>
        <FilterPills items={pillItems} value={platformKey} onChange={setPlatformKey} variant="dark" />
      </MimiCard>

      {catalogChrome ? (
        <MimiCard variant="dark">
          <ul className="divide-y divide-white/10">
            <li>
              <FilterSwitchRow label="Anuncios" checked={catalogShowAnuncios} onChange={setCatalogShowAnuncios} variant="dark" />
            </li>
            <li>
              <FilterSwitchRow label="Eventos" checked={catalogShowEventos} onChange={setCatalogShowEventos} variant="dark" />
            </li>
          </ul>
        </MimiCard>
      ) : (
        <MimiCard variant="dark">
          <FilterSectionTitle>Filtros</FilterSectionTitle>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 border-b border-white/10 py-2.5 text-sm font-semibold text-white/90">
            <span className="text-white/70">Solo ficha detallada</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-mimi-black text-white accent-white"
              checked={richFichaOnly}
              onChange={(e) => setRichFichaOnly(e.target.checked)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/10 py-2.5 text-sm font-semibold text-white/90">
            <span className="text-white/70">Solo eventos (deportes, UFC…)</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-mimi-black text-white accent-white"
              checked={eventsOnly}
              onChange={(e) => setEventsOnly(e.target.checked)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/10 py-2.5 text-sm font-semibold text-white/90">
            <span className="text-white/70">Hasta 30 días</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-mimi-black text-white accent-white"
              checked={shortOnly}
              onChange={(e) => setShortOnly(e.target.checked)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 py-2.5 text-sm font-semibold text-white/90">
            <span className="text-white/70">Menos de S/. 25</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-mimi-black text-white accent-white"
              checked={budgetOnly}
              onChange={(e) => setBudgetOnly(e.target.checked)}
            />
          </label>
        </MimiCard>
      )}

      <MimiCard variant="dark">
        <FilterSectionTitle>Categorías</FilterSectionTitle>
        <ul className="mt-2 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setCategoryKey("all")}
              className={[
                "w-full rounded-mimi px-3 py-2 text-left text-sm font-semibold transition",
                categoryKey === "all" ? "bg-white text-mimi-black" : "text-white/75 hover:bg-white/10",
              ].join(" ")}
            >
              Todas
            </button>
          </li>
          {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setCategoryKey(key)}
                className={[
                  "w-full rounded-mimi px-3 py-2 text-left text-sm font-semibold transition",
                  categoryKey === key ? "bg-white text-mimi-black" : "text-white/75 hover:bg-white/10",
                ].join(" ")}
              >
                {CATEGORY_LABEL[key]}
              </button>
            </li>
          ))}
        </ul>
      </MimiCard>
    </>
  );
}
