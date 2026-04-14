import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { dataClient } from "@/lib/dataClient";
import { claimStatusBadgeTone, claimStatusLabel } from "@/lib/orderStatus";
import { getUrl } from "aws-amplify/storage";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function ClientClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState<string | null>(null);
  const [attendedAt, setAttendedAt] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState("—");
  const [orderID, setOrderID] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await dataClient.models.CustomerClaim.get({ id: claimId });
        const c = res.data;
        if (!c?.id) throw new Error("Reclamo no encontrado.");
        if (!cancelled) {
          setDetail(c.detail ?? "");
          setStatus(c.status ?? null);
          setAdminResponse(c.adminResponse ?? null);
          setAttendedAt(c.attendedAt ?? null);
          setCreatedAt((c as { createdAt?: string }).createdAt ?? null);
          setOrderID(c.orderID);
        }
        const or = await dataClient.models.CustomerOrder.get({ id: c.orderID });
        const o = or.data;
        if (o?.servicePlanID) {
          const pr = await dataClient.models.ServicePlan.get({ id: o.servicePlanID });
          const p = pr.data;
          if (p) {
            const plr = await dataClient.models.Platform.get({ id: p.platformID });
            if (!cancelled) setPlanLabel(plr.data ? `${plr.data.name} · ${p.name}` : p.name);
          }
        }
        const key = c.imageStorageKey?.trim();
        if (key) {
          try {
            const u = await getUrl({ path: key });
            if (!cancelled) setImageUrl(u.url.toString());
          } catch {
            if (!cancelled) setImageUrl(null);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [claimId]);

  if (!claimId) {
    return <p className="text-mimi-muted">Enlace no válido.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/app/reclamos" className="text-sm font-bold text-white/70 hover:text-white">
          ← Mis reclamos
        </Link>
      </div>

      {loading && <MimiLoadingState tone="dark" layout="inline" className="mt-4" />}
      {error && (
        <div className="mt-6 rounded-mimi border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {!loading && !error && (
        <div className="max-w-2xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Reclamo</h1>
              <p className="mt-1 text-sm text-mimi-muted">
                Pedido: <span className="font-mono text-white/80">{orderID.slice(0, 8)}…</span> · {planLabel}
              </p>
              {createdAt ? (
                <p className="mt-1 text-xs text-mimi-muted">Enviado: {new Date(createdAt).toLocaleString("es-PE")}</p>
              ) : null}
            </div>
            <StatusBadge tone={claimStatusBadgeTone(status)} variant="onDark">
              {claimStatusLabel(status)}
            </StatusBadge>
          </div>

          <section className="rounded-mimi border border-white/10 bg-mimi-elevated p-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-mimi-muted">Tu mensaje</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/90">{detail}</p>
            {imageUrl ? (
              <div className="mt-4">
                <p className="text-xs font-bold text-mimi-muted">Imagen adjunta</p>
                <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-white underline">
                  Ver imagen
                </a>
              </div>
            ) : null}
          </section>

          {status === "ATTENDED" && adminResponse?.trim() ? (
            <section className="rounded-mimi border border-emerald-500/30 bg-emerald-950/25 p-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-emerald-200/90">Respuesta de MimiPlay</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/95">{adminResponse}</p>
              {attendedAt ? (
                <p className="mt-3 text-xs text-emerald-200/70">
                  Respondido: {new Date(attendedAt).toLocaleString("es-PE")}
                </p>
              ) : null}
            </section>
          ) : (
            <p className="text-sm text-mimi-muted">
              Cuando el equipo revise tu caso, verás aquí la respuesta oficial.
            </p>
          )}

          <Link
            to={`/app/pedidos/${orderID}`}
            className="inline-block text-sm font-bold text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"
          >
            Ver pedido en detalle →
          </Link>
        </div>
      )}
    </div>
  );
}
