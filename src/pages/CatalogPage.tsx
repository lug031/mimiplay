import { PlanMarketplace } from "@/components/marketplace/PlanMarketplace";
import { listCatalogPlans, type PlanRow } from "@/lib/catalogApi";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listCatalogPlans();
        if (!cancelled) setPlans(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el catálogo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="font-manrope">
      <div className="bg-mimi-surface px-0 pb-8 pt-6 sm:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <PlanMarketplace
            plans={plans}
            loading={loading}
            error={error}
            buildCtaTo={(planId, opcion) => {
              const q = new URLSearchParams();
              q.set("anuncioId", planId);
              if (opcion) q.set("opcion", opcion);
              return `/app/pedido/nuevo?${q.toString()}`;
            }}
            ctaLabel="Lo quiero"
            catalogChrome
            bannerTitle="Anuncios y accesos disponibles"
            bannerSubtitle="Filtra por plataforma y categoría. Los precios son los vigentes para nuevas compras. Inicia sesión para generar el pedido y adjuntar tu comprobante."
            searchText={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}
