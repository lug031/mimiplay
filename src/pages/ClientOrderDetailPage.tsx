import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { ClientCopyableCredentialText, RevealablePasswordReadonly } from "@/components/ui/PasswordReveal";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dataClient } from "@/lib/dataClient";
import { orderChosenOptionSummaryLine } from "@/lib/purchaseOptions";
import { formatCredentialRenewalDisplay } from "@/lib/formatCredentialRenewal";
import { orderStatusLabel } from "@/lib/orderStatus";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ClientOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState("");
  const [chosenSummary, setChosenSummary] = useState<string | null>(null);
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
        const chosenLabel = (o as { chosenOptionLabel?: string | null }).chosenOptionLabel;
        const chosenDays = (o as { chosenDurationDays?: number | null }).chosenDurationDays;
        const chosenPrice = (o as { chosenPricePen?: number | null }).chosenPricePen;
        if (!cancelled) {
          setChosenSummary(
            chosenLabel != null && chosenLabel !== ""
              ? orderChosenOptionSummaryLine(chosenLabel, chosenDays ?? null, chosenPrice ?? null)
              : null,
          );
        }
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
    return <p className="text-mimi-muted">Pedido no válido.</p>;
  }

  return (
    <div>
      <Link to="/app/pedidos" className="text-sm font-bold text-white/90 hover:underline">
        ← Mis pedidos
      </Link>

      {loading && <MimiLoadingState tone="dark" layout="inline" className="mt-6" />}
      {error && (
        <div className="mt-6 rounded-mimi border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Detalle del pedido</h1>
            <p className="mt-1 text-sm text-mimi-muted">
              <span className="font-bold text-white/80">Anuncio:</span> {planLabel}
            </p>
            {chosenSummary ? (
              <p className="mt-1 text-sm text-white/85">
                <span className="font-bold text-white/80">Opción contratada:</span> {chosenSummary}
              </p>
            ) : null}
            <p className="mt-2 max-w-xl text-sm text-mimi-muted">
              Seguimiento comercial de tu compra de acceso: validación de pago, asignación desde inventario y entrega de
              credenciales cuando corresponda.
            </p>
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

          {status === "FULFILLED" && (credentials.email || credentials.password) && (
            <div className="rounded-mimi border border-white/15 bg-mimi-elevated p-5">
              <h2 className="text-lg font-extrabold text-white">Tus credenciales</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {credentials.email && (
                  <div>
                    <dt className="font-bold text-white/80">Correo</dt>
                    <dd>
                      <ClientCopyableCredentialText value={credentials.email} copyLabel="Copiar correo" />
                    </dd>
                  </div>
                )}
                {credentials.password && (
                  <div>
                    <dt className="font-bold text-white/80">Contraseña</dt>
                    <dd>
                      <RevealablePasswordReadonly
                        password={credentials.password}
                        resetKey={`${orderId}:${credentials.password}`}
                        variant="client"
                      />
                    </dd>
                  </div>
                )}
                {credentials.profile && (
                  <div>
                    <dt className="font-bold text-white/80">Perfil</dt>
                    <dd className="font-mono text-white">{credentials.profile}</dd>
                  </div>
                )}
                {credentials.pin && (
                  <div>
                    <dt className="font-bold text-white/80">PIN</dt>
                    <dd className="font-mono text-white">{credentials.pin}</dd>
                  </div>
                )}
                {credentials.renews && (
                  <div>
                    <dt className="font-bold text-white/80">Renovación / vigencia</dt>
                    <dd className="text-white/90">{formatCredentialRenewalDisplay(credentials.renews)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {status === "PAYMENT_SUBMITTED" && (
            <p className="text-sm text-mimi-muted">
              Estamos revisando tu pago. Cuando se confirme, verás aquí el estado y luego las credenciales.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
