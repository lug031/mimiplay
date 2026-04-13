import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getUrl } from "aws-amplify/storage";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { PasswordRevealInput } from "@/components/ui/PasswordReveal";
import { adminDataClient } from "@/lib/dataClient";
import { orderStatusBadgeTone, orderStatusLabel, paymentMethodLabel } from "@/lib/orderStatus";
import { formatCredentialRenewalDisplay } from "@/lib/formatCredentialRenewal";
import { notifyOrderCredentialsUpdated } from "@/lib/notifications";
import { orderChosenOptionSummaryLine } from "@/lib/purchaseOptions";
import { StatusBadge } from "@/components/ui/StatusBadge";

type OrderRow = {
  id: string;
  status: string | null | undefined;
  owner?: string | null;
  payerFullName?: string | null;
  paymentMethod?: string | null;
  servicePlanID: string;
  planLabel: string;
  chosenSummary?: string | null;
  createdAt?: string | null;
};

type OrderDetail = {
  id: string;
  status?: string | null;
  payerFullName?: string | null;
  payerSecurityCode?: string | null;
  paymentProofStorageKey?: string | null;
  servicePlanID: string;
  /** Copia al crear pedido; usada si el anuncio ya no existe. */
  orderedPlatformID?: string | null;
  orderedPlanVariantKey?: string | null;
  chosenOptionLabel?: string | null;
  chosenDurationDays?: number | null;
  chosenPricePen?: number | null;
  credentialEmail?: string | null;
  credentialPassword?: string | null;
  credentialProfile?: string | null;
  credentialPin?: string | null;
  credentialRenewsAt?: string | null;
  /** Titular Cognito del pedido (`sub` o `sub::username`); necesario para avisos al cliente. */
  owner?: string | null;
};

async function fetchOrderDetailForAdmin(orderId: string): Promise<{
  order: OrderDetail | null | undefined;
  proofUrl: string | null;
}> {
  const res = await adminDataClient.models.CustomerOrder.get({ id: orderId });
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
  return { order: o as OrderDetail | null | undefined, proofUrl };
}

/** Crea la asignación y marca la cuenta como reservada al pedido (entrega inicial o reemplazo). */
async function assignInventoryAccountToOrder(
  orderId: string,
  platformAccountId: string,
  confirmedAtIso: string,
): Promise<void> {
  const { errors: e1 } = await adminDataClient.models.AccountAssignment.create({
    orderID: orderId,
    platformAccountID: platformAccountId,
    source: "MANUAL",
    status: "ADMIN_CONFIRMED",
    confirmedAt: confirmedAtIso,
  });
  if (e1?.length) throw new Error(e1.map((x) => x.message).join("; "));
  const { errors: e2 } = await adminDataClient.models.PlatformAccount.update({
    id: platformAccountId,
    status: "ASSIGNED",
    reservedOrderID: orderId,
  });
  if (e2?.length) throw new Error(e2.map((x) => x.message).join("; "));
}

/** Solo el cuerpo de la lista de credenciales; el título va en la tarjeta del modal. */
function AdminDeliveredCredentialsBody({ order }: { order: OrderDetail }) {
  if (!order.credentialEmail && !order.credentialPassword) return null;
  return (
    <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
      {order.credentialEmail ? (
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">Correo</dt>
          <dd className="mt-1 break-all font-mono text-mimi-black">{order.credentialEmail}</dd>
        </div>
      ) : null}
      {order.credentialPassword ? (
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">Contraseña</dt>
          <dd className="mt-1 break-all font-mono text-mimi-black">{order.credentialPassword}</dd>
        </div>
      ) : null}
      {order.credentialProfile ? (
        <div className="min-w-0">
          <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">Perfil</dt>
          <dd className="mt-1 font-mono text-mimi-black">{order.credentialProfile}</dd>
        </div>
      ) : null}
      {order.credentialPin ? (
        <div className="min-w-0">
          <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">PIN</dt>
          <dd className="mt-1 font-mono text-mimi-black">{order.credentialPin}</dd>
        </div>
      ) : null}
      {order.credentialRenewsAt ? (
        <div className="border-t border-mimi-black/10 pt-4 sm:col-span-2">
          <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">Vigencia hasta</dt>
          <dd className="mt-1 text-base font-semibold text-mimi-black">
            {formatCredentialRenewalDisplay(order.credentialRenewsAt)}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function AdminModalCard({
  title,
  description,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-mimi-black/10 bg-gradient-to-b from-white to-mimi-black/[0.02] p-4 shadow-sm sm:p-5 ${className}`}
    >
      <h3 className="text-sm font-extrabold tracking-tight text-mimi-black">{title}</h3>
      {description ? <p className="mt-1.5 text-xs leading-relaxed text-mimi-muted">{description}</p> : null}
      <div className={description ? "mt-4" : "mt-3"}>{children}</div>
    </section>
  );
}

const STATUS_OPTIONS = [
  "ALL",
  "PAYMENT_SUBMITTED",
  "PAYMENT_CONFIRMED",
  "FULFILLED",
  "CANCELLED",
  "MANUAL_ASSIGNMENT_NEEDED",
] as const;

/** Cuenta sin `planVariantKey` sirve para cualquier anuncio de la plataforma; si tiene clave, debe coincidir con el anuncio. */
function accountMatchesServicePlan(
  accountVariantKey: string | null | undefined,
  planVariantKey: string | null | undefined,
): boolean {
  const av = (accountVariantKey ?? "").trim();
  const pv = (planVariantKey ?? "").trim();
  if (!av) return true;
  if (!pv) return false;
  return av === pv;
}

function accountPickLabel(a: {
  internalLabel?: string | null;
  loginEmail: string;
  planVariantKey?: string | null;
}): string {
  const base = a.internalLabel?.trim() || a.loginEmail;
  const v = a.planVariantKey?.trim();
  return v ? `${base} (${v})` : base;
}

function proofMediaKind(storageKey: string | null | undefined): "image" | "pdf" | "unknown" {
  if (!storageKey) return "unknown";
  if (/\.(png|jpe?g|gif|webp)$/i.test(storageKey)) return "image";
  if (/\.pdf$/i.test(storageKey)) return "pdf";
  return "unknown";
}

function AdminPaymentProofPanel({
  storageKey,
  url,
}: {
  storageKey: string | null | undefined;
  url: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!url) {
    return <p className="text-sm text-mimi-muted">Sin comprobante adjunto.</p>;
  }
  const kind = proofMediaKind(storageKey);

  return (
    <div className="flex min-h-0 flex-col">
      <p className="text-xs font-extrabold uppercase tracking-wide text-mimi-subtle">Comprobante</p>
      {kind === "image" && !imgFailed ? (
        <img
          src={url}
          alt="Comprobante de pago"
          className="mt-2 max-h-[min(70vh,520px)] w-full rounded-xl border border-mimi-black/12 bg-mimi-black/[0.03] object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      {kind === "image" && imgFailed ? (
        <p className="mt-2 text-sm text-amber-800">No se pudo mostrar la imagen. Usa el enlace inferior.</p>
      ) : null}
      {kind === "pdf" ? (
        <iframe
          title="Comprobante PDF"
          src={url}
          className="mt-2 h-[min(70vh,520px)] w-full rounded-xl border border-mimi-black/12 bg-mimi-black/[0.03]"
        />
      ) : null}
      {kind === "unknown" && !imgFailed ? (
        <img
          src={url}
          alt="Comprobante de pago"
          className="mt-2 max-h-[min(70vh,520px)] w-full rounded-xl border border-mimi-black/12 bg-mimi-black/[0.03] object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      {kind === "unknown" && imgFailed ? (
        <p className="mt-2 text-sm text-mimi-subtle">Vista previa no disponible para este tipo de archivo.</p>
      ) : null}
      {imgFailed ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 text-xs font-bold text-mimi-black underline decoration-mimi-black/30 underline-offset-2 hover:decoration-mimi-black"
        >
          Abrir comprobante en pestaña nueva
        </a>
      ) : null}
    </div>
  );
}

export function AdminOrdersPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [filter, setFilter] = useState<string>("ALL");
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
  const [replaceCredentialsBusy, setReplaceCredentialsBusy] = useState(false);

  /** Formulario de entrega / reemplazo: vacío en pago confirmado; copia del pedido si ya está entregado. */
  function syncCredentialFormToOrder(o: OrderDetail | null | undefined) {
    if (!o) return;
    if (o.status === "FULFILLED" && (o.credentialEmail || o.credentialPassword)) {
      setCe(o.credentialEmail ?? "");
      setCp(o.credentialPassword ?? "");
      setCprof(o.credentialProfile ?? "");
      setCpin(o.credentialPin ?? "");
      setSelectedAccountId("");
    } else {
      setCe("");
      setCp("");
      setCprof("");
      setCpin("");
      setSelectedAccountId("");
    }
  }

  async function releasePriorInventoryAssignments(orderId: string) {
    const { data, errors } = await adminDataClient.models.AccountAssignment.list();
    if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
    const rows = (data ?? []).filter((a) => a.orderID === orderId);
    for (const asg of rows) {
      if (asg.status !== "ADMIN_CONFIRMED" || !asg.id || !asg.platformAccountID) continue;
      const { errors: u1 } = await adminDataClient.models.AccountAssignment.update({
        id: asg.id,
        status: "SUPERSEDED",
      });
      if (u1?.length) throw new Error(u1.map((x) => x.message).join("; "));
      const { errors: u2 } = await adminDataClient.models.PlatformAccount.update({
        id: asg.platformAccountID,
        status: "AVAILABLE",
        reservedOrderID: null,
      });
      if (u2?.length) throw new Error(u2.map((x) => x.message).join("; "));
    }
  }

  /** Tras leer el pedido: detalle en estado, inventario compatible y formulario de credenciales. */
  async function applyOrderPayloadToModal(o: OrderDetail | null | undefined, proofUrl: string | null) {
    setDetail({ order: o, proofUrl });
    if (o?.servicePlanID) {
      await hydrateAvailAccountsFromOrder({
        servicePlanID: o.servicePlanID,
        orderedPlatformID: o.orderedPlatformID,
        orderedPlanVariantKey: o.orderedPlanVariantKey,
      });
    } else {
      setAvailAccounts([]);
    }
    if (o) syncCredentialFormToOrder(o);
  }

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
        const co = o as {
          chosenOptionLabel?: string | null;
          chosenDurationDays?: number | null;
          chosenPricePen?: number | null;
        };
        const chosenSummary =
          co.chosenOptionLabel != null && co.chosenOptionLabel !== ""
            ? orderChosenOptionSummaryLine(co.chosenOptionLabel, co.chosenDurationDays ?? null, co.chosenPricePen ?? null)
            : null;
        enriched.push({
          id: o.id,
          status: o.status,
          owner: (o as { owner?: string }).owner,
          payerFullName: o.payerFullName,
          paymentMethod: o.paymentMethod,
          servicePlanID: o.servicePlanID,
          planLabel,
          chosenSummary,
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

  async function hydrateAvailAccountsFromOrder(o: {
    servicePlanID: string;
    orderedPlatformID?: string | null;
    orderedPlanVariantKey?: string | null;
  }) {
    try {
      let platformID: string | undefined;
      let planVariantKey: string | null | undefined;

      try {
        const pr = await adminDataClient.models.ServicePlan.get({ id: o.servicePlanID });
        const plan = pr.data;
        if (plan?.platformID) {
          platformID = plan.platformID;
          planVariantKey = (plan as { planVariantKey?: string | null }).planVariantKey ?? null;
        }
      } catch {
        /* anuncio borrado o error de red */
      }

      if (!platformID && o.orderedPlatformID) {
        platformID = o.orderedPlatformID;
        planVariantKey = o.orderedPlanVariantKey ?? null;
      }

      if (!platformID) {
        setAvailAccounts([]);
        return;
      }

      const planVariantForMatch = (planVariantKey ?? "").trim();
      let accounts: {
        id?: string | null;
        internalLabel?: string | null;
        loginEmail: string;
        loginPassword: string;
        profileLabel?: string | null;
        pin?: string | null;
        planVariantKey?: string | null;
        platformID?: string | null;
        status?: string | null;
      }[] = [];
      try {
        const filtered = await adminDataClient.models.PlatformAccount.list({
          filter: {
            and: [{ platformID: { eq: platformID } }, { status: { eq: "AVAILABLE" } }],
          },
        });
        accounts = filtered.data ?? [];
      } catch {
        accounts = [];
      }
      if (!accounts.length) {
        const all = await adminDataClient.models.PlatformAccount.list();
        accounts = (all.data ?? []).filter(
          (a) => a.platformID === platformID && a.status === "AVAILABLE",
        );
      }
      const matched = accounts.filter((a) =>
        accountMatchesServicePlan(a.planVariantKey, planVariantForMatch || undefined),
      );
      setAvailAccounts(
        matched.map((a) => ({
          id: a.id!,
          label: accountPickLabel(a),
          email: a.loginEmail,
          password: a.loginPassword,
          profile: a.profileLabel,
          pin: a.pin,
        })),
      );
    } catch {
      setAvailAccounts([]);
    }
  }

  async function openDetail(id: string) {
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setSelectedAccountId("");
    setCe("");
    setCp("");
    setCprof("");
    setCpin("");
    setAvailAccounts([]);
    try {
      const { order: o, proofUrl } = await fetchOrderDetailForAdmin(id);
      await applyOrderPayloadToModal(o, proofUrl);
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

  async function reloadOrderInModal() {
    if (!openId) return;
    try {
      const { order: o, proofUrl } = await fetchOrderDetailForAdmin(openId);
      await applyOrderPayloadToModal(o, proofUrl);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "No se pudo actualizar el pedido", "error");
    }
  }

  async function confirmPayment() {
    if (!openId) return;
    setDetailLoading(true);
    try {
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
      showSnackbar("Pago confirmado. Completa la entrega de credenciales.", "success");
      await refresh();
      await reloadOrderInModal();
    } finally {
      setDetailLoading(false);
    }
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
    const durationDays = detail.order.chosenDurationDays;
    if (durationDays == null || !Number.isFinite(durationDays) || durationDays < 1) {
      showSnackbar(
        "Este pedido no tiene días de vigencia registrados en la opción contratada. No se puede calcular el fin de acceso.",
        "warning",
      );
      return;
    }

    if (
      !window.confirm(
        `¿Confirmar envío de credenciales al cliente? La vigencia se calculará desde ahora: ${Math.floor(durationDays)} día(s) hasta el fin del acceso. El estado pasará a Entregado.`,
      )
    ) {
      return;
    }
    const email = ce.trim();
    const password = cp.trim();
    if (!email || !password) {
      showSnackbar("Correo y contraseña son obligatorios para entregar.", "warning");
      return;
    }

    const nowDate = new Date();
    const now = nowDate.toISOString();
    const renewAt = new Date(nowDate.getTime());
    renewAt.setUTCDate(renewAt.getUTCDate() + Math.floor(durationDays));
    const renewIso = renewAt.toISOString();

    try {
      if (selectedAccountId) {
        await assignInventoryAccountToOrder(openId, selectedAccountId, now);
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
      await reloadOrderInModal();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al entregar", "error");
    }
  }

  /** Sustituye credenciales en un pedido ya entregado; mantiene `credentialRenewsAt` y libera asignaciones previas del inventario. */
  async function replaceCredentialsKeepVigencia() {
    if (!openId || !detail?.order || detail.order.status !== "FULFILLED") return;
    const keepRenewsAt = detail.order.credentialRenewsAt;
    if (!keepRenewsAt) {
      showSnackbar(
        "Este pedido no tiene fecha de vigencia guardada. Corrige los datos del pedido antes de usar el reemplazo.",
        "warning",
      );
      return;
    }
    const email = ce.trim();
    const password = cp.trim();
    if (!email || !password) {
      showSnackbar("Correo y contraseña son obligatorios.", "warning");
      return;
    }
    const vigenciaTxt = formatCredentialRenewalDisplay(keepRenewsAt);
    if (
      !window.confirm(
        `¿Actualizar las credenciales de este pedido?\n\nLa fecha de fin de vigencia no cambiará: ${vigenciaTxt}.\n\nSi había una cuenta del inventario vinculada, se liberará. Puedes elegir otra cuenta disponible o dejar los datos solo manuales.`,
      )
    ) {
      return;
    }

    setReplaceCredentialsBusy(true);
    try {
      await releasePriorInventoryAssignments(openId);

      if (selectedAccountId) {
        await assignInventoryAccountToOrder(openId, selectedAccountId, new Date().toISOString());
      }

      const { errors: e3 } = await adminDataClient.models.CustomerOrder.update({
        id: openId,
        credentialEmail: email,
        credentialPassword: password,
        credentialProfile: cprof.trim() || undefined,
        credentialPin: cpin.trim() || undefined,
        credentialRenewsAt: keepRenewsAt,
      });
      if (e3?.length) throw new Error(e3.map((x) => x.message).join("; "));

      const note = await notifyOrderCredentialsUpdated(adminDataClient, {
        orderOwnerField: detail.order.owner,
        orderId: openId,
      });
      if (!note.ok) {
        showSnackbar(note.errorMessage, "warning");
      }

      showSnackbar("Credenciales actualizadas. La vigencia del plan se mantiene.", "success");
      await refresh();
      await reloadOrderInModal();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al actualizar credenciales", "error");
    } finally {
      setReplaceCredentialsBusy(false);
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
      <h1 className="text-2xl font-extrabold text-mimi-black">Pedidos</h1>
      <p className="mt-2 text-sm text-mimi-subtle">
        Comprobantes, confirmación de pagos y cierre con entrega de credenciales. En pedidos ya entregados puedes{" "}
        <strong className="font-bold text-mimi-black">reemplazar credenciales</strong> si la cuenta falla, sin cambiar la
        fecha de fin de vigencia del plan contratado. Usa el filtro para ver solo los que tienen pago enviado u otro
        estado.
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
              <th className="px-3 py-2 font-bold">Anuncio</th>
              <th className="px-3 py-2 font-bold">Cliente / titular</th>
              <th className="px-3 py-2 font-bold">Estado</th>
              <th className="px-3 py-2 font-bold" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="border-b border-mimi-black/12 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{r.planLabel}</span>
                  {r.chosenSummary ? (
                    <div className="mt-0.5 text-xs text-mimi-subtle">Opción: {r.chosenSummary}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-mimi-subtle">
                  {r.payerFullName || r.owner || "—"}
                  {r.paymentMethod ? ` · ${paymentMethodLabel(r.paymentMethod)}` : ""}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone={orderStatusBadgeTone(r.status)} variant="onLight">
                    {orderStatusLabel(r.status)}
                  </StatusBadge>
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
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-mimi-black/12 bg-white p-5 shadow-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mimi-black/10 pb-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-lg font-extrabold text-mimi-black">Pedido {openId.slice(0, 8)}…</h2>
                {!detailLoading && detail?.order ? (
                  <StatusBadge tone={orderStatusBadgeTone(detail.order.status)} variant="onLight">
                    {orderStatusLabel(detail.order.status)}
                  </StatusBadge>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-mimi-subtle hover:bg-mimi-black/[0.04] hover:text-mimi-black"
                onClick={closeDetail}
              >
                Cerrar
              </button>
            </div>

            {detailLoading && <MimiLoadingState tone="light" layout="inline" className="mt-4 py-6" />}

            {!detailLoading && detail?.order && (
              <div className="mt-4 space-y-6 text-sm">
                {st === "PAYMENT_CONFIRMED" ? (
                  <div className="space-y-3">
                    <p className="font-bold text-mimi-black">Entregar credenciales</p>
                      {availAccounts.length > 0 ? (
                        <div>
                          <label className="block text-xs font-bold text-mimi-subtle">
                            Cuenta del inventario compatible con este pedido
                          </label>
                          <p className="mt-1 text-xs text-mimi-subtle">
                            Solo se listan cuentas disponibles de la misma plataforma que el anuncio, sin variante
                            específica o con la misma clave de variante que el anuncio.
                          </p>
                          <select
                            className="mt-2 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                            value={selectedAccountId}
                            onChange={(e) => onPickAccount(e.target.value)}
                          >
                            <option value="">— Escribir manualmente —</option>
                            {availAccounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-900">
                          No hay cuentas en inventario que coincidan con este anuncio (plataforma y variante). Puedes
                          entregar credenciales manualmente abajo.
                        </p>
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
                    <p className="text-xs leading-relaxed text-mimi-subtle">
                      La <strong className="text-mimi-black">fecha de fin de vigencia</strong> se guarda al marcar entregado:
                      desde ese momento se suman los días de la opción que compró el cliente.
                      {detail.order.chosenDurationDays != null &&
                      Number.isFinite(detail.order.chosenDurationDays) &&
                      detail.order.chosenDurationDays >= 1 ? (
                        <>
                          {" "}
                          En este pedido: <strong className="text-mimi-black">{Math.floor(detail.order.chosenDurationDays)} días</strong>.
                        </>
                      ) : (
                        <span className="block pt-1 font-bold text-amber-900">
                          Este pedido no tiene días de vigencia guardados; no se podrá completar la entrega hasta corregirlo.
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
                      onClick={() => void fulfillOrder()}
                    >
                      Marcar entregado
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_minmax(280px,36%)] lg:items-start">
                      <div className="min-w-0 space-y-4">
                        <AdminModalCard
                          title="Resumen del pedido"
                          description="Titular del pago y opción contratada."
                        >
                          <dl className="grid gap-4 sm:grid-cols-2">
                            {detail.order.payerFullName ? (
                              <div className="min-w-0 sm:col-span-2">
                                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">
                                  Titular del pago
                                </dt>
                                <dd className="mt-1 font-medium text-mimi-black">{detail.order.payerFullName}</dd>
                              </div>
                            ) : null}
                            {detail.order.payerSecurityCode ? (
                              <div className="min-w-0">
                                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">
                                  Código / ref.
                                </dt>
                                <dd className="mt-1 font-mono text-sm text-mimi-black">{detail.order.payerSecurityCode}</dd>
                              </div>
                            ) : null}
                            {detail.order.chosenOptionLabel ? (
                              <div className="min-w-0 sm:col-span-2">
                                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">
                                  Opción contratada
                                </dt>
                                <dd className="mt-1 text-mimi-black">
                                  {orderChosenOptionSummaryLine(
                                    detail.order.chosenOptionLabel,
                                    detail.order.chosenDurationDays ?? null,
                                    detail.order.chosenPricePen ?? null,
                                  )}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </AdminModalCard>

                        {st === "FULFILLED" && (detail.order.credentialEmail || detail.order.credentialPassword) ? (
                          <AdminModalCard
                            title="Acceso que ve el cliente"
                            description="Misma información que en el detalle del pedido en su cuenta."
                          >
                            <AdminDeliveredCredentialsBody order={detail.order} />
                          </AdminModalCard>
                        ) : null}

                        {st === "FULFILLED" && detail.order.credentialRenewsAt ? (
                          <AdminModalCard
                            title="Sustituir acceso"
                            description="Si el acceso falló, actualiza credenciales aquí. La fecha de fin de vigencia no cambia (es la indicada arriba en «Acceso que ve el cliente»)."
                          >
                            {availAccounts.length > 0 ? (
                              <div className="mt-4">
                                <label className="text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle">
                                  Inventario (opcional)
                                </label>
                                <p className="mt-1 text-xs text-mimi-muted">
                                  Al elegir una cuenta, se vincula al pedido y la anterior vuelve a disponible.
                                </p>
                                <select
                                  className="mt-2 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                                  value={selectedAccountId}
                                  onChange={(e) => onPickAccount(e.target.value)}
                                >
                                  <option value="">Escribir solo a mano</option>
                                  {availAccounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <p className="mt-4 text-xs text-mimi-muted">
                                Sin cuentas disponibles en inventario para este anuncio; introduce los datos a mano.
                              </p>
                            )}
                            <div className="mt-4 grid gap-3">
                              <input
                                className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                                placeholder="Correo"
                                autoComplete="off"
                                value={ce}
                                onChange={(e) => setCe(e.target.value)}
                              />
                              <PasswordRevealInput
                                placeholder="Contraseña"
                                value={cp}
                                onChange={setCp}
                                resetKey={`replace-${openId}`}
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                                  placeholder="Perfil (opcional)"
                                  value={cprof}
                                  onChange={(e) => setCprof(e.target.value)}
                                />
                                <input
                                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                                  placeholder="PIN (opcional)"
                                  value={cpin}
                                  onChange={(e) => setCpin(e.target.value)}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={replaceCredentialsBusy}
                              className="mt-5 w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                              onClick={() => void replaceCredentialsKeepVigencia()}
                            >
                              {replaceCredentialsBusy ? "Guardando…" : "Guardar nuevas credenciales"}
                            </button>
                          </AdminModalCard>
                        ) : st === "FULFILLED" ? (
                          <AdminModalCard title="Sustituir acceso">
                            <p className="text-xs text-amber-900">
                              Este pedido no tiene vigencia registrada; corrige el dato antes de usar el reemplazo
                              guiado.
                            </p>
                          </AdminModalCard>
                        ) : null}
                      </div>

                      <div className="self-start lg:sticky lg:top-1">
                        <AdminPaymentProofPanel
                          key={detail.proofUrl ?? detail.order.paymentProofStorageKey ?? "none"}
                          storageKey={detail.order.paymentProofStorageKey}
                          url={detail.proofUrl}
                        />
                      </div>
                    </div>

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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
