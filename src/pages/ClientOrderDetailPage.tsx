import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUrl } from "aws-amplify/storage";
import { dataClient } from "@/lib/dataClient";
import { orderStatusLabel } from "@/lib/orderStatus";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ClientOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    email?: string | null;
    password?: string | null;
    profile?: string | null;
    pin?: string | null;
    renews?: string | null;
  }>({});

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await dataClient.models.CustomerOrder.get({ id: orderId });
        const o = res.data;
        if (!o) {
          if (!cancelled) setError("Pedido no encontrado.");
          return;
        }
        if (!cancelled) setStatus(o.status);
        if (o.servicePlanID) {
          const pr = await dataClient.models.ServicePlan.get({ id: o.servicePlanID });
          const p = pr.data;
          if (p) {
            const plr = await dataClient.models.Platform.get({ id: p.platformID });
            if (!cancelled) {
              setPlanLabel(plr.data ? `${plr.data.name} · ${p.name}` : p.name);
            }
          }
        }
        if (o.paymentProofStorageKey) {
          try {
            const u = await getUrl({ path: o.paymentProofStorageKey });
            if (!cancelled) setProofUrl(u.url.toString());
          } catch {
            if (!cancelled) setProofUrl(null);
          }
        }
        if (!cancelled) {
          setCredentials({
            email: o.credentialEmail,
            password: o.credentialPassword,
            profile: o.credentialProfile,
            pin: o.credentialPin,
            renews: o.credentialRenewsAt,
          });
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
  }, [orderId]);

  if (!orderId) {
    return <p className="text-tcr-text-muted">Pedido no válido.</p>;
  }

  return (
    <div>
      <Link to="/app/pedidos" className="text-sm font-bold text-tcr-teal hover:underline">
        ← Mis pedidos
      </Link>

      {loading && <p className="mt-6 text-tcr-text-muted">Cargando…</p>}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-tcr-dark">Detalle del pedido</h1>
            <p className="mt-1 text-sm text-tcr-text-muted">{planLabel}</p>
            <div className="mt-3">
              <StatusBadge
                tone={
                  status === "FULFILLED"
                    ? "success"
                    : status === "CANCELLED"
                      ? "danger"
                      : status === "PAYMENT_SUBMITTED"
                        ? "warning"
                        : "info"
                }
              >
                {orderStatusLabel(status)}
              </StatusBadge>
            </div>
          </div>

          {proofUrl && (
            <div className="rounded-2xl border border-tcr-border bg-white p-4">
              <h2 className="text-sm font-bold text-tcr-dark">Comprobante enviado</h2>
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-bold text-tcr-teal hover:underline"
              >
                Abrir comprobante
              </a>
              <div className="mt-3 overflow-hidden rounded-lg border border-tcr-border">
                <img src={proofUrl} alt="Comprobante" className="max-h-80 w-full object-contain" />
              </div>
            </div>
          )}

          {status === "FULFILLED" && (credentials.email || credentials.password) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-lg font-extrabold text-emerald-900">Tus credenciales</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {credentials.email && (
                  <div>
                    <dt className="font-bold text-emerald-900">Correo</dt>
                    <dd className="font-mono text-emerald-950">{credentials.email}</dd>
                  </div>
                )}
                {credentials.password && (
                  <div>
                    <dt className="font-bold text-emerald-900">Contraseña</dt>
                    <dd className="font-mono text-emerald-950">{credentials.password}</dd>
                  </div>
                )}
                {credentials.profile && (
                  <div>
                    <dt className="font-bold text-emerald-900">Perfil</dt>
                    <dd className="font-mono text-emerald-950">{credentials.profile}</dd>
                  </div>
                )}
                {credentials.pin && (
                  <div>
                    <dt className="font-bold text-emerald-900">PIN</dt>
                    <dd className="font-mono text-emerald-950">{credentials.pin}</dd>
                  </div>
                )}
                {credentials.renews && (
                  <div>
                    <dt className="font-bold text-emerald-900">Renovación / vigencia</dt>
                    <dd className="text-emerald-950">
                      {new Date(credentials.renews).toLocaleString("es-PE")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {status === "PAYMENT_SUBMITTED" && (
            <p className="text-sm text-tcr-text-muted">
              Estamos revisando tu pago. Cuando se confirme, verás aquí el estado y luego las credenciales.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
