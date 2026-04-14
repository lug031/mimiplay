import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { dataClient } from "@/lib/dataClient";
import { uploadClaimImage } from "@/lib/storageClaimImage";
import { orderStatusLabel } from "@/lib/orderStatus";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type OrderOption = { id: string; label: string };

export function ClientNewClaimPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderID, setOrderID] = useState("");
  const [detail, setDetail] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, errors } = await dataClient.models.CustomerOrder.list();
        if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
        const opts: OrderOption[] = [];
        for (const o of data ?? []) {
          if (!o.id) continue;
          let planLabel = "Pedido";
          if (o.servicePlanID) {
            const pr = await dataClient.models.ServicePlan.get({ id: o.servicePlanID });
            const p = pr.data;
            if (p) {
              const plr = await dataClient.models.Platform.get({ id: p.platformID });
              planLabel = plr.data ? `${plr.data.name} · ${p.name}` : p.name;
            }
          }
          opts.push({
            id: o.id,
            label: `${planLabel} · ${orderStatusLabel(o.status)} · ${o.id.slice(0, 8)}…`,
          });
        }
        opts.sort((a, b) => a.label.localeCompare(b.label));
        if (!cancelled) {
          setOrders(opts);
          if (opts.length === 1) setOrderID(opts[0].id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar pedidos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = detail.trim();
    if (!orderID || !d) {
      setError("Elige un pedido y describe tu reclamo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let imageStorageKey: string | undefined;
      if (file) {
        imageStorageKey = await uploadClaimImage(file);
      }
      const { data, errors } = await dataClient.models.CustomerClaim.create({
        orderID,
        detail: d,
        status: "PENDING",
        ...(imageStorageKey ? { imageStorageKey } : {}),
      });
      if (errors?.length) throw new Error(errors.map((x) => x.message).join("; "));
      if (!data?.id) throw new Error("No se pudo crear el reclamo.");
      navigate(`/app/reclamos/${data.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/app/reclamos" className="text-sm font-bold text-white/70 hover:text-white">
          ← Volver a reclamos
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold text-white">Nuevo reclamo</h1>
      <p className="mt-1 max-w-xl text-sm text-mimi-muted">
        Indica el pedido afectado y describe el problema. Opcionalmente adjunta una captura.
      </p>

      {loading && <MimiLoadingState tone="dark" layout="inline" className="mt-6" />}

      {!loading && orders.length === 0 && (
        <p className="mt-6 text-mimi-muted">
          No tienes pedidos para asociar.{" "}
          <Link to="/catalogo" className="font-bold text-white underline">
            Ir al catálogo
          </Link>
        </p>
      )}

      {!loading && orders.length > 0 && (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 max-w-xl space-y-5">
          {error ? (
            <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div>
            <label htmlFor="claim-order" className="block text-xs font-extrabold uppercase tracking-wide text-mimi-muted">
              Pedido
            </label>
            <select
              id="claim-order"
              required
              value={orderID}
              onChange={(e) => setOrderID(e.target.value)}
              className="mt-2 w-full rounded-mimi border border-white/15 bg-mimi-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-white/35"
            >
              <option value="">Selecciona un pedido</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="claim-detail" className="block text-xs font-extrabold uppercase tracking-wide text-mimi-muted">
              Detalle del reclamo
            </label>
            <textarea
              id="claim-detail"
              required
              rows={6}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Describe qué ocurre, fechas útiles y lo que esperas."
              className="mt-2 w-full resize-y rounded-mimi border border-white/15 bg-mimi-elevated px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/35"
            />
          </div>

          <div>
            <label htmlFor="claim-file" className="block text-xs font-extrabold uppercase tracking-wide text-mimi-muted">
              Imagen (opcional, máx. 5 MB)
            </label>
            <input
              id="claim-file"
              type="file"
              accept="image/*"
              className="mt-2 w-full text-sm text-white/80 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-bold file:text-mimi-black"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-mimi-black shadow-sm transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Enviar reclamo"}
            </button>
            <Link
              to="/app/reclamos"
              className="inline-flex items-center rounded-full border border-white/25 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
