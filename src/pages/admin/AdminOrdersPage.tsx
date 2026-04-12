import { useEffect, useMemo, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { adminDataClient } from "@/lib/dataClient";
import { orderStatusLabel, paymentMethodLabel } from "@/lib/orderStatus";
import { StatusBadge } from "@/components/ui/StatusBadge";

type OrderRow = {
  id: string;
  status: string | null | undefined;
  owner?: string | null;
  payerFullName?: string | null;
  paymentMethod?: string | null;
  servicePlanID: string;
  planLabel: string;
  createdAt?: string | null;
};

type OrderDetail = {
  id: string;
  status?: string | null;
  payerFullName?: string | null;
  payerSecurityCode?: string | null;
  paymentProofStorageKey?: string | null;
  servicePlanID: string;
};

type Props = {
  /** Si true, filtra por defecto a comprobantes pendientes de revisión. */
  queueOnly?: boolean;
};

const STATUS_OPTIONS = [
  "ALL",
  "PAYMENT_SUBMITTED",
  "PAYMENT_CONFIRMED",
  "FULFILLED",
  "CANCELLED",
  "MANUAL_ASSIGNMENT_NEEDED",
] as const;

export function AdminOrdersPage({ queueOnly }: Props) {
  const { showSnackbar } = useAdminSnackbar();
  const [filter, setFilter] = useState<string>(queueOnly ? "PAYMENT_SUBMITTED" : "ALL");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    order: OrderDetail | null | undefined;
    proofUrl: string | null;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [availAccounts, setAvailAccounts] = useState<
    { id: string; label: string; email: string; password: string; profile?: string | null; pin?: string | null }[]
  >([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [ce, setCe] = useState("");
  const [cp, setCp] = useState("");
  const [cprof, setCprof] = useState("");
  const [cpin, setCpin] = useState("");
  const [renewLocal, setRenewLocal] = useState("");

  const filteredRows = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function refresh() {
    setLoading(true);
    try {
      const [or, pr, plr] = await Promise.all([
        adminDataClient.models.CustomerOrder.list(),
        adminDataClient.models.ServicePlan.list(),
        adminDataClient.models.Platform.list(),
      ]);
      const pmap = new Map((plr.data ?? []).filter((x) => x.id).map((x) => [x.id, x]));
      const planMap = new Map((pr.data ?? []).filter((x) => x.id).map((x) => [x.id, x]));
      const enriched: OrderRow[] = [];
      for (const o of or.data ?? []) {
        if (!o.id) continue;
        const p = planMap.get(o.servicePlanID);
        const plat = p ? pmap.get(p.platformID) : undefined;
        const planLabel = p ? (plat ? `${plat.name} · ${p.name}` : p.name) : "—";
        enriched.push({
          id: o.id,
          status: o.status,
          owner: (o as { owner?: string }).owner,
          payerFullName: o.payerFullName,
          paymentMethod: o.paymentMethod,
          servicePlanID: o.servicePlanID,
          planLabel,
          createdAt: (o as { createdAt?: string }).createdAt,
        });
      }
      enriched.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setRows(enriched);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al cargar pedidos", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function openDetail(id: string) {
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setSelectedAccountId("");
    setCe("");
    setCp("");
    setCprof("");
    setCpin("");
    setRenewLocal("");
    setAvailAccounts([]);
    try {
      const res = await adminDataClient.models.CustomerOrder.get({ id });
      const o = res.data;
      let proofUrl: string | null = null;
      if (o?.paymentProofStorageKey) {
        try {
          const u = await getUrl({ path: o.paymentProofStorageKey });
          proofUrl = u.url.toString();
        } catch {
          proofUrl = null;
        }
      }
      setDetail({ order: o as OrderDetail, proofUrl });

      if (o?.servicePlanID) {
        const pr = await adminDataClient.models.ServicePlan.get({ id: o.servicePlanID });
        const plan = pr.data;
        if (plan?.platformID) {
          let accounts: {
            id?: string | null;
            internalLabel?: string | null;
            loginEmail: string;
            loginPassword: string;
            profileLabel?: string | null;
            pin?: string | null;
          }[] = [];
          try {
            const filtered = await adminDataClient.models.PlatformAccount.list({
              filter: {
                and: [{ platformID: { eq: plan.platformID } }, { status: { eq: "AVAILABLE" } }],
              },
            });
            accounts = filtered.data ?? [];
          } catch {
            accounts = [];
          }
          if (!accounts.length) {
            const all = await adminDataClient.models.PlatformAccount.list();
            accounts = (all.data ?? []).filter(
              (a) => a.platformID === plan.platformID && a.status === "AVAILABLE",
            );
          }
          setAvailAccounts(
            (accounts ?? []).map((a) => ({
              id: a.id!,
              label: a.internalLabel || a.loginEmail,
              email: a.loginEmail,
              password: a.loginPassword,
              profile: a.profileLabel,
              pin: a.pin,
            })),
          );
        }
      }
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al abrir pedido", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setOpenId(null);
    setDetail(null);
  }

  async function confirmPayment() {
    if (!openId) return;
    const { errors } = await adminDataClient.models.CustomerOrder.update({
      id: openId,
      status: "PAYMENT_CONFIRMED",
      paymentConfirmedAt: new Date().toISOString(),
    });
    if (errors?.length) {
      const t = errors.map((x) => x.message).join("; ");
      showSnackbar(t, snackbarVariantForMessage(t));
      return;
    }
    showSnackbar("Pago confirmado.", "success");
    await refresh();
    closeDetail();
  }

  async function cancelOrder() {
    if (!openId) return;
    if (!window.confirm("¿Cancelar este pedido?")) return;
    const { errors } = await adminDataClient.models.CustomerOrder.update({
      id: openId,
      status: "CANCELLED",
    });
    if (errors?.length) {
      const t = errors.map((x) => x.message).join("; ");
      showSnackbar(t, snackbarVariantForMessage(t));
      return;
    }
    showSnackbar("Pedido cancelado.", "success");
    await refresh();
    closeDetail();
  }

  async function fulfillOrder() {
    if (!openId || !detail?.order) return;
    const email = ce.trim();
    const password = cp.trim();
    if (!email || !password) {
      showSnackbar("Correo y contraseña son obligatorios para entregar.", "warning");
      return;
    }
    let renewIso: string;
    try {
      if (!renewLocal) throw new Error("Indica fecha/hora de renovación o vigencia.");
      renewIso = new Date(renewLocal).toISOString();
    } catch {
      showSnackbar("Fecha de renovación no válida.", "warning");
      return;
    }

    const now = new Date().toISOString();

    try {
      if (selectedAccountId) {
        const { errors: e1 } = await adminDataClient.models.AccountAssignment.create({
          orderID: openId,
          platformAccountID: selectedAccountId,
          source: "MANUAL",
          status: "ADMIN_CONFIRMED",
          confirmedAt: now,
        });
        if (e1?.length) throw new Error(e1.map((x) => x.message).join("; "));

        const { errors: e2 } = await adminDataClient.models.PlatformAccount.update({
          id: selectedAccountId,
          status: "ASSIGNED",
          reservedOrderID: openId,
        });
        if (e2?.length) throw new Error(e2.map((x) => x.message).join("; "));
      }

      const { errors: e3 } = await adminDataClient.models.CustomerOrder.update({
        id: openId,
        status: "FULFILLED",
        fulfilledAt: now,
        activationStartsAt: now,
        credentialEmail: email,
        credentialPassword: password,
        credentialProfile: cprof.trim() || undefined,
        credentialPin: cpin.trim() || undefined,
        credentialRenewsAt: renewIso,
      });
      if (e3?.length) throw new Error(e3.map((x) => x.message).join("; "));

      showSnackbar("Pedido entregado.", "success");
      await refresh();
      closeDetail();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al entregar", "error");
    }
  }

  function onPickAccount(id: string) {
    setSelectedAccountId(id);
    if (!id) return;
    const a = availAccounts.find((x) => x.id === id);
    if (a) {
      setCe(a.email);
      setCp(a.password);
      setCprof(a.profile ?? "");
      setCpin(a.pin ?? "");
    }
  }

  const st = detail?.order?.status;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-mimi-black">{queueOnly ? "Cola de revisión" : "Pedidos"}</h1>
      <p className="mt-2 text-sm text-mimi-subtle">
        {queueOnly
          ? "Bandeja de compras con comprobante recibido: validación de pago antes de liberar acceso."
          : "Vista global de ventas: comprobantes, confirmación de ingresos y cierre operativo con entrega de credenciales."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-mimi-black">Filtrar</label>
        <select
          className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">Todos</option>
          {STATUS_OPTIONS.filter((x) => x !== "ALL").map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-full border border-mimi-black/12 bg-white px-4 py-2 text-sm font-bold hover:border-mimi-black/28"
          onClick={() => void refresh()}
        >
          Actualizar
        </button>
      </div>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-6" />}

      <div className="mt-8 overflow-x-auto rounded-xl border border-mimi-black/12 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mimi-black/12 bg-mimi-black/[0.06]">
            <tr>
              <th className="px-3 py-2 font-bold">Pedido</th>
              <th className="px-3 py-2 font-bold">Plan</th>
              <th className="px-3 py-2 font-bold">Cliente / titular</th>
              <th className="px-3 py-2 font-bold">Estado</th>
              <th className="px-3 py-2 font-bold" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="border-b border-mimi-black/12 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                <td className="px-3 py-2">{r.planLabel}</td>
                <td className="px-3 py-2 text-mimi-subtle">
                  {r.payerFullName || r.owner || "—"}
                  {r.paymentMethod ? ` · ${paymentMethodLabel(r.paymentMethod)}` : ""}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone="neutral">{orderStatusLabel(r.status)}</StatusBadge>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="font-bold text-mimi-black hover:underline"
                    onClick={() => void openDetail(r.id)}
                  >
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-mimi-black/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-extrabold">Pedido {openId.slice(0, 8)}…</h2>
              <button type="button" className="text-sm font-bold text-mimi-subtle hover:text-mimi-black" onClick={closeDetail}>
                Cerrar
              </button>
            </div>

            {detailLoading && <MimiLoadingState tone="light" layout="inline" className="mt-4 py-6" />}

            {!detailLoading && detail?.order && (
              <div className="mt-4 space-y-4 text-sm">
                <p>
                  <strong>Estado:</strong> {orderStatusLabel(detail.order.status)}
                </p>
                {detail.order.payerFullName && (
                  <p>
                    <strong>Titular pago:</strong> {detail.order.payerFullName}
                  </p>
                )}
                {detail.order.payerSecurityCode && (
                  <p>
                    <strong>Código / ref.:</strong> {detail.order.payerSecurityCode}
                  </p>
                )}
                {detail.proofUrl && (
                  <div>
                    <p className="font-bold">Comprobante</p>
                    <a href={detail.proofUrl} target="_blank" rel="noreferrer" className="text-mimi-black hover:underline">
                      Abrir archivo
                    </a>
                    {detail.proofUrl.match(/\.(png|jpe?g|gif|webp)$/i) && (
                      <img src={detail.proofUrl} alt="" className="mt-2 max-h-48 w-full rounded-lg border object-contain" />
                    )}
                  </div>
                )}

                {st === "PAYMENT_SUBMITTED" && (
                  <div className="flex flex-wrap gap-2 border-t border-mimi-black/12 pt-4">
                    <button
                      type="button"
                      className="rounded-full bg-mimi-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                      onClick={() => void confirmPayment()}
                    >
                      Confirmar pago
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-50"
                      onClick={() => void cancelOrder()}
                    >
                      Cancelar pedido
                    </button>
                  </div>
                )}

                {st === "PAYMENT_CONFIRMED" && (
                  <div className="space-y-3 border-t border-mimi-black/12 pt-4">
                    <p className="font-bold text-mimi-black">Entregar credenciales</p>
                    {availAccounts.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-mimi-subtle">Cuenta del inventario (opcional)</label>
                        <select
                          className="mt-1 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                          value={selectedAccountId}
                          onChange={(e) => onPickAccount(e.target.value)}
                        >
                          <option value="">— Manual —</option>
                          {availAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <input
                      className="w-full rounded-lg border border-mimi-black/12 px-3 py-2"
                      placeholder="Correo"
                      value={ce}
                      onChange={(e) => setCe(e.target.value)}
                    />
                    <input
                      className="w-full rounded-lg border border-mimi-black/12 px-3 py-2"
                      placeholder="Contraseña"
                      value={cp}
                      onChange={(e) => setCp(e.target.value)}
                    />
                    <input
                      className="w-full rounded-lg border border-mimi-black/12 px-3 py-2"
                      placeholder="Perfil (opcional)"
                      value={cprof}
                      onChange={(e) => setCprof(e.target.value)}
                    />
                    <input
                      className="w-full rounded-lg border border-mimi-black/12 px-3 py-2"
                      placeholder="PIN (opcional)"
                      value={cpin}
                      onChange={(e) => setCpin(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-bold text-mimi-subtle">Fecha/hora renovación o fin de vigencia</label>
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg border border-mimi-black/12 px-3 py-2"
                        value={renewLocal}
                        onChange={(e) => setRenewLocal(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
                      onClick={() => void fulfillOrder()}
                    >
                      Marcar entregado
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
