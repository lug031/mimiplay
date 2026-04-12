import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { dataClient } from "@/lib/dataClient";
import { uploadPaymentProof } from "@/lib/storagePayment";
import { CATEGORY_LABEL } from "@/lib/orderStatus";

function formatPen(n: number) {
  return `S/${n.toFixed(2)}`;
}

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
      setLoadError("Selecciona un plan desde la lista de planes.");
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
        <p className="text-tcr-text-muted">Falta el parámetro de plan.</p>
        <Link to="/app/planes" className="mt-4 inline-block font-bold text-tcr-teal">
          Ver planes
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <p className="text-red-700">{loadError}</p>
        <Link to="/app/planes" className="mt-4 inline-block font-bold text-tcr-teal">
          Volver a planes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/app/planes" className="text-sm font-bold text-tcr-teal hover:underline">
        ← Volver a planes
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-tcr-dark">Nuevo pedido</h1>

      <div className="mt-6 rounded-2xl border border-tcr-border bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-tcr-teal">
          {category ? CATEGORY_LABEL[category] ?? category : "Servicio"}
        </p>
        <h2 className="mt-1 text-xl font-extrabold">{platformName}</h2>
        <p className="font-semibold">{planName}</p>
        <p className="mt-2 text-sm text-tcr-text-muted">
          {durationDays} días · <span className="font-extrabold text-tcr-dark">{formatPen(pricePen)}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-bold text-tcr-dark" htmlFor="method">
            Método de pago
          </label>
          <select
            id="method"
            className="mt-1 w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="YAPE">Yape</option>
            <option value="PLIN">Plin</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-tcr-dark" htmlFor="name">
            Nombre completo del titular del pago
          </label>
          <input
            id="name"
            className="mt-1 w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
            value={payerFullName}
            onChange={(e) => setPayerFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-tcr-dark" htmlFor="code">
            Código de seguridad / operación
          </label>
          <input
            id="code"
            className="mt-1 w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
            value={payerSecurityCode}
            onChange={(e) => setPayerSecurityCode(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-tcr-dark" htmlFor="file">
            Comprobante de pago
          </label>
          <input
            id="file"
            type="file"
            accept="image/*,.pdf"
            className="mt-1 w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-tcr-teal py-3 text-sm font-bold text-white hover:bg-[#007a8f] disabled:opacity-60"
        >
          {submitting ? "Enviando…" : "Enviar pedido"}
        </button>
      </form>
    </div>
  );
}
