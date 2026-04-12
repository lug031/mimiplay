import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { dataClient } from "@/lib/dataClient";
import { uploadPaymentProof } from "@/lib/storagePayment";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { CATEGORY_LABEL } from "@/lib/orderStatus";

export function ClientNewOrderPage() {
  const [search] = useSearchParams();
  const planId = search.get("planId");
  const navigate = useNavigate();

  const [planName, setPlanName] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [pricePen, setPricePen] = useState(0);
  const [durationDays, setDurationDays] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("YAPE");
  const [payerFullName, setPayerFullName] = useState("");
  const [payerSecurityCode, setPayerSecurityCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setLoadError("Selecciona un plan desde el catálogo.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const planRes = await dataClient.models.ServicePlan.get({ id: planId });
        const plan = planRes.data;
        if (!plan) {
          if (!cancelled) setLoadError("Plan no encontrado.");
          return;
        }
        const platRes = await dataClient.models.Platform.get({ id: plan.platformID });
        const plat = platRes.data;
        if (!cancelled) {
          setPlanName(plan.name);
          setDurationDays(plan.durationDays);
          setPricePen(plan.pricePen);
          setPlatformName(plat?.name ?? "—");
          setCategory(plat?.category ?? null);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Error al cargar el plan");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId]);

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

    setSubmitting(true);
    try {
      const key = await uploadPaymentProof(file);
      const { data, errors } = await dataClient.models.CustomerOrder.create({
        servicePlanID: planId,
        status: "PAYMENT_SUBMITTED",
        paymentMethod,
        paymentProofStorageKey: key,
        payerFullName: payerFullName.trim(),
        payerSecurityCode: payerSecurityCode.trim(),
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
        <p className="text-mimi-muted">Falta el parámetro de plan.</p>
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
        <p className="mt-2 text-sm text-mimi-muted">
          {durationDays} días · <span className="font-extrabold text-white">{formatPlanPrice(pricePen)}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-bold text-white" htmlFor="method">
            Método de pago
          </label>
          <select
            id="method"
            className="mt-1 w-full rounded-mimi border border-white/15 bg-mimi-black px-3 py-2 text-sm text-white"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="YAPE">Pago móvil instantáneo (A)</option>
            <option value="PLIN">Pago móvil instantáneo (B)</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
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
          disabled={submitting}
          className="w-full rounded-full bg-white py-3 text-sm font-extrabold text-mimi-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {submitting ? "Enviando…" : "Enviar pedido"}
        </button>
      </form>
    </div>
  );
}
