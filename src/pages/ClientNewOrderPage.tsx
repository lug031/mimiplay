import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { dataClient } from "@/lib/dataClient";
import { uploadPaymentProof } from "@/lib/storagePayment";
import { MIMIPLAY_PAYMENT } from "@/config/mimiPaymentFlow";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
import {
  findPurchaseOption,
  parsePurchaseOptionsJson,
  purchaseChoicesForPlan,
  type PurchaseOption,
} from "@/lib/purchaseOptions";

export function ClientNewOrderPage() {
  const [search] = useSearchParams();
  const planId = search.get("anuncioId") ?? search.get("planId");
  const opcionParam = search.get("opcion");
  const navigate = useNavigate();

  const [planName, setPlanName] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [choices, setChoices] = useState<PurchaseOption[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [payerFullName, setPayerFullName] = useState("");
  const [payerSecurityCode, setPayerSecurityCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
          if (!cancelled) setLoadError("Anuncio no encontrado.");
          return;
        }
        const platRes = await dataClient.models.Platform.get({ id: plan.platformID });
        const plat = platRes.data;
        const purchaseOptions = parsePurchaseOptionsJson(
          (plan as { purchaseOptionsJson?: string | null }).purchaseOptionsJson,
        );
        const ch = purchaseChoicesForPlan({
          purchaseOptions,
          durationDays: plan.durationDays,
          pricePen: plan.pricePen,
        });
        const fromUrl = findPurchaseOption(ch, opcionParam);
        if (!cancelled) {
          setPlanName(plan.name);
          setPlatformName(plat?.name ?? "—");
          setCategory(plat?.category ?? null);
          setChoices(ch);
          if (ch.length > 1) {
            setSelectedId(fromUrl?.id ?? "");
          } else {
            setSelectedId(ch[0]?.id ?? "");
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Error al cargar el anuncio");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId, opcionParam]);

  const selected = useMemo(
    () => choices.find((c) => c.id === selectedId) ?? (choices.length === 1 ? choices[0] : undefined),
    [choices, selectedId],
  );

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

    setSubmitting(true);
    try {
      const key = await uploadPaymentProof(file);
      const { data, errors } = await dataClient.models.CustomerOrder.create({
        servicePlanID: planId,
        status: "PAYMENT_SUBMITTED",
        paymentMethod: MIMIPLAY_PAYMENT.methodCode,
        paymentProofStorageKey: key,
        payerFullName: payerFullName.trim(),
        payerSecurityCode: payerSecurityCode.trim(),
        chosenPricePen: selected.pricePen,
        chosenDurationDays: selected.durationDays,
        chosenOptionLabel: selected.label,
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

  const showChoicePicker = choices.length > 1;

  return (
    <div>
      <Link to="/catalogo" className="text-sm font-bold text-white/90 hover:underline">
        ← Volver al catálogo
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-white">Nuevo pedido</h1>
      <p className="mt-2 max-w-2xl text-sm text-mimi-muted">
        Formaliza la compra del acceso seleccionado: indica datos del titular del pago, adjunta el comprobante y envía
        el pedido para su validación comercial.
      </p>

      <div className="mt-6 rounded-mimi border border-white/10 bg-mimi-elevated p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-white/70">
          {category ? CATEGORY_LABEL[category] ?? category : "Servicio"}
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-white">{platformName}</h2>
        <p className="font-semibold text-white/90">{planName}</p>
        {showChoicePicker ? (
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-white/60">Opción que compras</p>
            <fieldset className="mt-2 space-y-2 rounded-mimi border border-white/10 bg-mimi-black/40 p-3">
              {choices.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 px-2.5 py-2 hover:bg-white/5 has-[:checked]:border-amber-400/45 has-[:checked]:bg-amber-500/10"
                >
                  <input
                    type="radio"
                    className="mt-1"
                    name="checkout-option"
                    value={c.id}
                    checked={selectedId === c.id}
                    onChange={() => setSelectedId(c.id)}
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-bold text-white">{c.label}</span>
                    <span className="mt-0.5 block text-xs text-white/60">
                      {formatPlanPrice(c.pricePen)} · {c.durationDays} días
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}
        <p className="mt-3 text-sm text-mimi-muted">
          {selected ? (
            <>
              {selected.durationDays} días · <span className="font-extrabold text-white">{formatPlanPrice(selected.pricePen)}</span>
              {selected.id !== "_base" ? (
                <span className="block text-xs text-white/50">{selected.label}</span>
              ) : null}
            </>
          ) : (
            <span className="text-amber-200/90">Selecciona una opción arriba para ver el importe.</span>
          )}
        </p>
      </div>

      <aside className="mt-8 max-w-lg rounded-mimi border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-mimi-black/80 p-5 shadow-inner">
        <h2 className="text-base font-extrabold tracking-tight text-white">
          Métodos de pagos <span className="text-amber-200/90">💳✨</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/90">
          <span className="mr-1.5" aria-hidden>
            1️⃣
          </span>
          <strong>Yape | Plin</strong>{" "}
          <span className="select-all font-mono text-base font-extrabold text-amber-100">{MIMIPLAY_PAYMENT.yapePlinDisplay}</span>
        </p>
        <p className="mt-2 text-sm text-white/85">
          <span className="font-bold text-amber-200/90">Titular:</span> {MIMIPLAY_PAYMENT.accountHolder}
        </p>
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-amber-200/90">Importante</p>
          <ul className="mt-2 space-y-2 text-sm text-white/80">
            <li className="flex gap-2">
              <span aria-hidden>
                🔹
              </span>
              <span>Envía la foto del comprobante de pago. 📷</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>
                🔹
              </span>
              <span>Verifica el número, nombre y monto.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>
                🔹
              </span>
              <span>Pregunta por nuestros combos y ahorra más.</span>
            </li>
          </ul>
        </div>
      </aside>

      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
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

        {formError && (
          <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{formError}</div>
        )}

        <button
          type="submit"
          disabled={submitting || !selected}
          className="w-full rounded-full bg-white py-3 text-sm font-extrabold text-mimi-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {submitting ? "Enviando…" : "Enviar pedido"}
        </button>
      </form>
    </div>
  );
}
