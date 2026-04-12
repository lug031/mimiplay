import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCatalogPlans, type PlanRow } from "@/lib/catalogApi";
import { CATEGORY_LABEL } from "@/lib/orderStatus";

function formatPen(n: number) {
  return `S/${n.toFixed(2)}`;
}

export function CatalogPage() {
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
    <div className="min-h-screen bg-tcr-bg font-manrope text-tcr-dark">
      <header className="border-b border-tcr-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-extrabold">
            Mimi<span className="text-tcr-teal">Play</span>
          </Link>
          <Link
            to="/app/planes"
            className="rounded-full bg-tcr-teal px-4 py-2 text-sm font-bold text-white hover:bg-[#007a8f]"
          >
            Comprar (inicia sesión)
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">Catálogo de planes</h1>
        <p className="mt-2 text-sm text-tcr-text-muted">
          Precios orientativos. La compra se confirma tras validar tu pago en el panel.
        </p>

        {loading && <p className="mt-8 text-tcr-text-muted">Cargando…</p>}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {!loading && !error && plans.length === 0 && (
          <p className="mt-8 text-tcr-text-muted">
            Aún no hay planes publicados. Un administrador debe cargar plataformas y planes desde el panel admin.
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.planId}
              className="flex flex-col rounded-2xl border border-tcr-border bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-tcr-teal">
                {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "Servicio"}
              </p>
              <h2 className="mt-1 text-lg font-extrabold">{p.platformName}</h2>
              <p className="mt-1 text-sm font-semibold text-tcr-dark">{p.planName}</p>
              <p className="mt-2 text-sm text-tcr-text-muted">{p.durationDays} días</p>
              <p className="mt-3 text-2xl font-extrabold text-tcr-dark">{formatPen(p.pricePen)}</p>
              <Link
                to={`/app/pedido/nuevo?planId=${encodeURIComponent(p.planId)}`}
                className="mt-4 inline-flex justify-center rounded-full bg-tcr-teal px-4 py-2 text-sm font-bold text-white hover:bg-[#007a8f]"
              >
                Solicitar este plan
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
