import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PlanCardPromoImage } from "@/components/marketplace/PlanOfferCard";
import { dataClient } from "@/lib/dataClient";
import { uploadPaymentProof } from "@/lib/storagePayment";
import { MIMIPLAY_PAYMENT } from "@/config/mimiPaymentFlow";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
import {
  catalogTierRowCaption,
  checkoutChoicesGrouped,
  checkoutTierChoices,
  findCheckoutTierChoice,
  formatChosenTierDetailLine,
  formatChosenTierLabel,
  parsePurchaseTierCatalog,
  type CheckoutTierChoice,
} from "@/lib/purchaseOptions";

type OrderStep = 1 | 2 | 3;

function ChosenTierSubline({ choice }: { choice: CheckoutTierChoice }) {
  const sub = formatChosenTierDetailLine(choice);
  if (!sub) return null;
  return <span className="mt-1 block text-xs text-white/50">{sub}</span>;
}

/** Texto fijo del paso de métodos de pago (tipografía matemática + emojis tal cual negocio). */
const PAYMENT_METHODS_BLOCK_HEAD = `𝕄𝔼𝕋𝕆𝔻𝕆𝕊 𝔻𝔼 ℙ𝔸𝔾𝕆𝕊 💳✨

1️⃣   YAPE | PLIN  `;

const PAYMENT_METHODS_BLOCK_TAIL = `
 🔸 TITULAR: `;

const PAYMENT_METHODS_BLOCK_FOOT = `

📜 𝕀𝕄ℙ𝕆ℝ𝕋𝔸ℕ𝕋𝔼:
🔹 Envía la foto del comprobante de pago. 📷
🔹 Verifica el numero, nombre y monto.
🔹 Pregunta por nuestros combos y ahorra más.`;

function CopyNumberButton({ digits }: { digits: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(digits);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [digits]);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Número copiado" : "Copiar número Yape o Plin"}
      title={copied ? "Copiado" : "Copiar número"}
      className="inline-flex shrink-0 items-center justify-center rounded-mimi border border-amber-400/40 bg-amber-500/15 p-1.5 text-amber-100 transition hover:border-amber-300/60 hover:bg-amber-500/25"
    >
      {copied ? (
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-200">Listo</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

function PaymentMethodsAside({ className, embedded }: { className?: string; embedded?: boolean }) {
  const digits = MIMIPLAY_PAYMENT.yapePlinDigits;
  const holder = MIMIPLAY_PAYMENT.accountHolder;

  const boxed =
    !embedded &&
    `max-w-lg rounded-mimi border p-5 shadow-inner ${className ?? "border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-mimi-black/80"}`;
  const flat = embedded && `w-full max-w-none ${className ?? ""}`;

  return (
    <aside className={boxed || flat || ""}>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
        {PAYMENT_METHODS_BLOCK_HEAD}
        <span className="inline-flex flex-wrap items-center gap-2 align-middle">
          <span className="select-all font-mono text-base font-extrabold tracking-tight text-amber-100">{digits}</span>
          <CopyNumberButton digits={digits} />
        </span>
        {PAYMENT_METHODS_BLOCK_TAIL}
        {holder}
        {PAYMENT_METHODS_BLOCK_FOOT}
      </div>
    </aside>
  );
}

function PlanChosenSummary({
  planName,
  platformName,
  selected,
  onChangeOption,
  className,
  embedded,
}: {
  planName: string;
  platformName: string;
  selected: CheckoutTierChoice | undefined;
  onChangeOption: () => void;
  className?: string;
  embedded?: boolean;
}) {
  const boxed =
    !embedded &&
    `rounded-mimi border p-5 shadow-sm ${className ?? "border-white/10 bg-mimi-elevated"}`;
  const flat = embedded && (className ?? "");

  return (
    <div className={boxed || flat || ""}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-white/55">Plan elegido</p>
      <p className="mt-1 font-semibold text-white">{planName}</p>
      <p className="text-sm text-mimi-muted">{platformName}</p>
      {selected ? (
        <p className="mt-3 text-sm text-white/90">
          <span className="font-extrabold tabular-nums text-white">{formatPlanPrice(selected.pricePen)}</span>
          <span className="text-mimi-muted"> · {selected.durationDays} días</span>
          <ChosenTierSubline choice={selected} />
        </p>
      ) : null}
      <button
        type="button"
        onClick={onChangeOption}
        className="mt-4 text-sm font-bold text-amber-200/90 hover:text-amber-100 hover:underline"
      >
        ← Cambiar opción
      </button>
    </div>
  );
}

export function ClientNewOrderPage() {
  const [search] = useSearchParams();
  const planId = search.get("anuncioId") ?? search.get("planId");
  const opcionParam = search.get("opcion");
  const navigate = useNavigate();

  const [planName, setPlanName] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [promoImageUrl, setPromoImageUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  /** Copiados al pedido para inventario/admin aunque el anuncio se elimine después. */
  const [snapshotPlatformId, setSnapshotPlatformId] = useState<string | null>(null);
  const [snapshotPlanVariantKey, setSnapshotPlanVariantKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [choices, setChoices] = useState<CheckoutTierChoice[]>([]);
  /** Índice en `choices` (evita colisiones si dos tiers comparten `id`). */
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [step, setStep] = useState<OrderStep>(1);

  const [payerFullName, setPayerFullName] = useState("");
  const [payerSecurityCode, setPayerSecurityCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setStep(1);
    setFormError(null);
  }, [planId, opcionParam]);

  useEffect(() => {
    if (!planId) {
      setLoadError("Selecciona un anuncio desde el catálogo.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const planRes = await dataClient.models.ServicePlan.get({ id: planId });
        const plan = planRes.data;
        if (!plan) {
          if (!cancelled) {
            setLoadError("Anuncio no encontrado.");
            setSnapshotPlatformId(null);
            setSnapshotPlanVariantKey(null);
          }
          return;
        }
        const platRes = await dataClient.models.Platform.get({ id: plan.platformID });
        const plat = platRes.data;
        const catalog = parsePurchaseTierCatalog(
          (plan as { purchaseOptionsJson?: string | null }).purchaseOptionsJson,
        );
        const ch = checkoutTierChoices(catalog, {
          durationDays: plan.durationDays,
          pricePen: plan.pricePen,
        });
        const fromUrl = findCheckoutTierChoice(ch, opcionParam);
        const urlIdx = fromUrl ? ch.findIndex((c) => c.id === fromUrl.id) : 0;
        if (!cancelled) {
          setPlanName(plan.name);
          setPlatformName(plat?.name ?? "—");
          setPromoImageUrl((plan as { promoImageUrl?: string | null }).promoImageUrl?.trim() || null);
          setCategory(plat?.category ?? null);
          setSnapshotPlatformId(plan.platformID);
          const pv = (plan as { planVariantKey?: string | null }).planVariantKey?.trim();
          setSnapshotPlanVariantKey(pv || null);
          setChoices(ch);
          setSelectedIndex(urlIdx >= 0 ? urlIdx : 0);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Error al cargar el anuncio");
          setSnapshotPlatformId(null);
          setSnapshotPlanVariantKey(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId, opcionParam]);

  const selected = useMemo(() => {
    if (choices.length === 0) return undefined;
    return choices[selectedIndex] ?? choices[0];
  }, [choices, selectedIndex]);

  const checkoutGroups = useMemo(() => checkoutChoicesGrouped(choices), [choices]);

  const showChoicePicker = choices.length > 1;
  const planReady = Boolean(planName) && choices.length > 0;

  function goStep2() {
    setFormError(null);
    if (!selected) {
      setFormError("Elige una opción de precio y vigencia para continuar.");
      return;
    }
    setStep(2);
  }

  function goStep3() {
    setFormError(null);
    setStep(3);
  }

  function goStep1() {
    setFormError(null);
    setStep(1);
  }

  function goStep2From3() {
    setFormError(null);
    setStep(2);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!planId) return;
    if (!payerFullName.trim()) {
      setFormError("Indica el nombre del titular del pago.");
      return;
    }
    if (!payerSecurityCode.trim()) {
      setFormError("Indica el código de seguridad o referencia.");
      return;
    }
    if (!file) {
      setFormError("Adjunta una imagen o PDF del comprobante.");
      return;
    }
    if (!selected) {
      setFormError("Elige una opción de precio y vigencia para este anuncio.");
      return;
    }
    if (!snapshotPlatformId) {
      setFormError("No se pudo determinar la plataforma del anuncio. Recarga la página e inténtalo de nuevo.");
      return;
    }

    setSubmitting(true);
    try {
      const key = await uploadPaymentProof(file);
      const { data, errors } = await dataClient.models.CustomerOrder.create({
        servicePlanID: planId,
        orderedPlatformID: snapshotPlatformId,
        orderedPlanVariantKey: snapshotPlanVariantKey ?? undefined,
        status: "PAYMENT_SUBMITTED",
        paymentMethod: MIMIPLAY_PAYMENT.methodCode,
        paymentProofStorageKey: key,
        payerFullName: payerFullName.trim(),
        payerSecurityCode: payerSecurityCode.trim(),
        chosenPricePen: selected.pricePen,
        chosenDurationDays: selected.durationDays,
        chosenOptionLabel: formatChosenTierLabel(selected),
      });
      if (errors?.length) {
        throw new Error(errors.map((x) => x.message).join("; "));
      }
      if (!data?.id) throw new Error("No se creó el pedido.");
      navigate(`/app/pedidos/${data.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al enviar el pedido");
    } finally {
      setSubmitting(false);
    }
  }

  if (!planId) {
    return (
      <div>
        <p className="text-mimi-muted">Falta el anuncio seleccionado.</p>
        <Link to="/catalogo" className="mt-4 inline-block font-bold text-white hover:underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <p className="text-red-300">{loadError}</p>
        <Link to="/catalogo" className="mt-4 inline-block font-bold text-white hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!planReady) {
    return (
      <div>
        <p className="text-mimi-muted">Cargando anuncio…</p>
      </div>
    );
  }

  const stepsMeta: { n: OrderStep; label: string; short: string }[] = [
    { n: 1, label: "Tu plan", short: "Plan" },
    { n: 2, label: "Métodos de pago", short: "Pago" },
    { n: 3, label: "Comprobante", short: "Comprobante" },
  ];

  const subtitle =
    step === 1
      ? "Elige la opción de compra de este anuncio."
      : step === 2
        ? "Usa los datos de pago y, cuando hayas pagado, continúa para adjuntar el comprobante."
        : "Completa los datos del titular y sube el comprobante para validar tu pedido.";

  return (
    <div>
      <Link to="/catalogo" className="text-sm font-bold text-white/90 hover:underline">
        ← Volver al catálogo
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-white">Nuevo pedido</h1>
      <p className="mt-2 max-w-2xl text-sm text-mimi-muted">{subtitle}</p>

      <nav className="mt-8 max-w-2xl" aria-label="Pasos del pedido">
        <ol className="flex items-start justify-between gap-1 sm:gap-2">
          {stepsMeta.map((s, i) => {
            const done = step > s.n;
            const current = step === s.n;
            const circleClass = current
              ? "border-white bg-white text-mimi-black shadow-md ring-2 ring-white/20"
              : done
                ? "border-emerald-400/80 bg-emerald-500/25 text-emerald-50"
                : "border-white/25 bg-mimi-black/50 text-white/45";
            return (
              <li key={s.n} className="contents">
                {i > 0 ? (
                  <div
                    className={`mb-5 mt-5 hidden h-0.5 min-w-[1rem] flex-1 sm:block ${step > stepsMeta[i - 1]!.n ? "bg-emerald-400/45" : "bg-white/12"}`}
                    aria-hidden
                  />
                ) : null}
                <div className="flex w-[30%] max-w-[9rem] flex-col items-center sm:w-auto sm:max-w-none">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold transition ${circleClass}`}
                    aria-current={current ? "step" : undefined}
                  >
                    {done ? "✓" : s.n}
                  </div>
                  <span
                    className={`mt-2 text-center text-[10px] font-bold leading-tight sm:text-xs ${
                      current ? "text-white" : done ? "text-emerald-100/90" : "text-mimi-muted"
                    }`}
                  >
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 1 ? (
        <div className="mt-8 rounded-mimi border border-white/10 bg-mimi-elevated p-6 shadow-sm">
          <div className={showChoicePicker ? "grid gap-8 lg:grid-cols-2 lg:items-start" : ""}>
            <div className={showChoicePicker ? "lg:border-r lg:border-white/10 lg:pr-8" : ""}>
              <p className="text-xs font-bold uppercase text-white/70">
                {category ? CATEGORY_LABEL[category] ?? category : "Servicio"}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-white">{platformName}</h2>
              <p className="font-semibold text-white/90">{planName}</p>
              <div className="mt-4 w-full max-w-[280px] sm:max-w-sm">
                <PlanCardPromoImage raw={promoImageUrl ?? ""} title={planName || "Anuncio"} catalogChrome />
              </div>
              {!showChoicePicker ? (
                <p className="mt-4 text-sm text-mimi-muted">
                  {selected ? (
                    <>
                      Resumen: {selected.durationDays} días ·{" "}
                      <span className="font-extrabold text-white">{formatPlanPrice(selected.pricePen)}</span>
                      <ChosenTierSubline choice={selected} />
                    </>
                  ) : (
                    <span className="text-amber-200/90">No hay opciones de compra disponibles.</span>
                  )}
                </p>
              ) : null}
            </div>
            {showChoicePicker ? (
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-white/60">Opción que compras</p>
                <fieldset className="mt-3 min-w-0 space-y-6 border-0 p-0">
                  {checkoutGroups.map((g) => (
                    <div key={g.groupId} className="space-y-2">
                      {g.groupTitle.trim() || g.groupEmoji ? (
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/65">
                          {g.groupEmoji ? <span className="mr-1 font-normal normal-case">{g.groupEmoji}</span> : null}
                          {g.groupTitle.trim()}
                        </p>
                      ) : null}
                      {g.choices.map((c) => {
                        const globalIdx = choices.indexOf(c);
                        return (
                          <label
                            key={`chk-${globalIdx}`}
                            className="flex cursor-pointer items-start gap-2.5 rounded-mimi border border-white/10 px-2.5 py-2 hover:bg-white/5 has-[:checked]:border-amber-400/45 has-[:checked]:bg-amber-500/10"
                          >
                            <input
                              type="radio"
                              className="mt-1"
                              name="checkout-option"
                              value={globalIdx}
                              checked={selectedIndex === globalIdx}
                              onChange={() => setSelectedIndex(globalIdx)}
                            />
                            <span className="min-w-0 text-sm">
                              <span className="font-bold text-white">{catalogTierRowCaption(c)}</span>
                              <span className="mt-0.5 block text-xs text-white/60">
                                {formatPlanPrice(c.pricePen)} · {c.durationDays} días
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </fieldset>
              </div>
            ) : null}
          </div>

          {showChoicePicker ? (
            <p className="mt-8 border-t border-white/10 pt-6 text-sm text-mimi-muted">
              {selected ? (
                <>
                  Resumen: {selected.durationDays} días ·{" "}
                  <span className="font-extrabold text-white">{formatPlanPrice(selected.pricePen)}</span>
                  <ChosenTierSubline choice={selected} />
                </>
              ) : (
                <span className="text-amber-200/90">No hay opciones de compra disponibles.</span>
              )}
            </p>
          ) : null}

          {formError ? (
            <div className="mt-4 rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{formError}</div>
          ) : null}

          <div
            className={
              showChoicePicker
                ? "mt-6 flex flex-wrap gap-3"
                : "mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6"
            }
          >
            <button
              type="button"
              disabled={!selected}
              onClick={goStep2}
              className="rounded-full bg-white px-6 py-3 text-sm font-extrabold text-mimi-black hover:bg-neutral-200 disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-8 rounded-mimi border border-white/10 bg-mimi-elevated p-6 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <PlanChosenSummary
              embedded
              planName={planName}
              platformName={platformName}
              selected={selected}
              onChangeOption={goStep1}
            />
            <div className="lg:border-l lg:border-white/10 lg:pl-8">
              <PaymentMethodsAside embedded />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={goStep1}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/90 hover:bg-white/10"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={goStep3}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-mimi-black hover:bg-neutral-200"
            >
              Continuar al comprobante
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <form
          onSubmit={onSubmit}
          className="mt-8 max-w-lg space-y-4 rounded-mimi border border-white/10 bg-mimi-elevated p-5 shadow-sm"
        >
            <h2 className="text-lg font-extrabold text-white">Comprobante y verificación</h2>
            <p className="text-sm text-mimi-muted">
              Los datos deben coincidir con el pago que realizaste. Usaremos el comprobante para validar el pedido.
            </p>
            <div>
              <label className="block text-sm font-bold text-white" htmlFor="name">
                Nombre completo del titular del pago
              </label>
              <input
                id="name"
                className="mt-1 w-full rounded-mimi border border-white/15 bg-mimi-black px-3 py-2 text-sm text-white"
                value={payerFullName}
                onChange={(e) => setPayerFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white" htmlFor="code">
                Código de seguridad / operación
              </label>
              <input
                id="code"
                className="mt-1 w-full rounded-mimi border border-white/15 bg-mimi-black px-3 py-2 text-sm text-white"
                value={payerSecurityCode}
                onChange={(e) => setPayerSecurityCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white" htmlFor="file">
                Comprobante de pago
              </label>
              <input
                id="file"
                type="file"
                accept="image/*,.pdf"
                className="mt-1 w-full text-sm text-white/90 file:mr-3 file:rounded-mimi file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-mimi-black"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {formError ? (
              <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{formError}</div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={goStep2From3}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/90 hover:bg-white/10"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={submitting || !selected}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-mimi-black hover:bg-neutral-200 disabled:opacity-60"
              >
                {submitting ? "Enviando…" : "Enviar pedido"}
              </button>
            </div>
        </form>
      ) : null}
    </div>
  );
}
