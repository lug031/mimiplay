import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCatalogPlansAuthed, type PlanRow } from "@/lib/catalogApi";
import { CATEGORY_LABEL } from "@/lib/orderStatus";

function formatPen(n: number) {
  return `S/${n.toFixed(2)}`;
}

export function ClientPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listCatalogPlansAuthed();
        if (!cancelled) setPlans(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Planes disponibles</h1>
      <p className="mt-2 text-sm text-tcr-text-muted">
        Elige un plan y sube tu comprobante de pago en el siguiente paso.
      </p>

      {loading && <p className="mt-6 text-tcr-text-muted">Cargando…</p>}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!loading && !error && plans.length === 0 && (
        <p className="mt-6 text-tcr-text-muted">No hay planes activos todavía.</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <article
            key={p.planId}
            className="rounded-2xl border border-tcr-border bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase text-tcr-teal">
              {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "Servicio"}
            </p>
            <h2 className="mt-1 text-lg font-extrabold">{p.platformName}</h2>
            <p className="text-sm font-semibold">{p.planName}</p>
            <p className="mt-2 text-sm text-tcr-text-muted">{p.durationDays} días · {formatPen(p.pricePen)}</p>
            <Link
              to={`/app/pedido/nuevo?planId=${encodeURIComponent(p.planId)}`}
              className="mt-4 inline-flex rounded-full bg-tcr-teal px-4 py-2 text-sm font-bold text-white hover:bg-[#007a8f]"
            >
              Solicitar
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
