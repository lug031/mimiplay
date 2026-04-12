import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { fetchAuthSession } from "aws-amplify/auth";
import { type FormEvent, useEffect, useState } from "react";

export type PlanRecord = {
  id: string;
  name: string;
  durationDays: number;
  pricePen: number;
  planVariantKey?: string | null;
  cardPresentation?: string | null;
  promoImageUrl?: string | null;
  cardTitle?: string | null;
  accessSummary?: string | null;
  qualitySummary?: string | null;
  devicesSummary?: string | null;
  compatibilitySummary?: string | null;
  stockNotice?: string | null;
  warningNotice?: string | null;
  extraContent?: string | null;
};

type Props = {
  plan: PlanRecord;
  onClose: () => void;
  onSaved: () => void;
};

const input =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400";

export function PlanMarketingModal({ plan, onClose, onSaved }: Props) {
  const { showSnackbar } = useAdminSnackbar();
  const [promoImageUrl, setPromoImageUrl] = useState("");
  const [cardTitle, setCardTitle] = useState("");
  const [accessSummary, setAccessSummary] = useState("");
  const [qualitySummary, setQualitySummary] = useState("");
  const [devicesSummary, setDevicesSummary] = useState("");
  const [compatibilitySummary, setCompatibilitySummary] = useState("");
  const [stockNotice, setStockNotice] = useState("");
  const [warningNotice, setWarningNotice] = useState("");
  const [extraContent, setExtraContent] = useState("");
  const [cardPresentation, setCardPresentation] = useState<"STANDARD" | "EVENT">("STANDARD");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPromoImageUrl(plan.promoImageUrl ?? "");
    setCardTitle(plan.cardTitle ?? "");
    setAccessSummary(plan.accessSummary ?? "");
    setQualitySummary(plan.qualitySummary ?? "");
    setDevicesSummary(plan.devicesSummary ?? "");
    setCompatibilitySummary(plan.compatibilitySummary ?? "");
    setStockNotice(plan.stockNotice ?? "");
    setWarningNotice(plan.warningNotice ?? "");
    setExtraContent(plan.extraContent ?? "");
    setCardPresentation(plan.cardPresentation === "EVENT" ? "EVENT" : "STANDARD");
  }, [plan]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchAuthSession({ forceRefresh: true });
      const res = await adminDataClient.models.ServicePlan.update(
        {
          id: plan.id,
          cardPresentation,
          promoImageUrl: promoImageUrl.trim() || undefined,
          cardTitle: cardTitle.trim() || undefined,
          accessSummary: accessSummary.trim() || undefined,
          qualitySummary: qualitySummary.trim() || undefined,
          devicesSummary: devicesSummary.trim() || undefined,
          compatibilitySummary: compatibilitySummary.trim() || undefined,
          stockNotice: stockNotice.trim() || undefined,
          warningNotice: warningNotice.trim() || undefined,
          extraContent: extraContent.trim() || undefined,
        },
        { authMode: "userPool" },
      );
      const errText = formatModelErrors(res.errors);
      if (errText) {
        showSnackbar(errText, snackbarVariantForMessage(errText));
        return;
      }
      showSnackbar("Anuncio del plan guardado.", "success");
      onSaved();
      onClose();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : "Error al guardar.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-mimi-black/70 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-mimi-elevated shadow-2xl sm:rounded-2xl"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="plan-marketing-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-mimi-elevated px-4 py-3">
          <h2 id="plan-marketing-title" className="text-base font-extrabold text-white">
            Anuncio del plan
          </h2>
          <button type="button" className="rounded-lg px-2 py-1 text-sm font-bold text-white/70 hover:bg-white/10" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="space-y-4 px-4 py-4" onSubmit={onSubmit}>
          <p className="text-xs leading-relaxed text-white/60">
            Referencia interna: <strong className="text-white">{plan.name}</strong> · {plan.durationDays} días · {formatPlanPrice(plan.pricePen)}{" "}
            (eso es lo que se compra al pulsar el botón en la tienda). Lo siguiente es solo presentación, como en WhatsApp.
          </p>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-card-kind">
              Tipo de tarjeta en la tienda
            </label>
            <select
              id="pm-card-kind"
              className={`${input} mt-1`}
              value={cardPresentation}
              onChange={(e) => setCardPresentation(e.target.value === "EVENT" ? "EVENT" : "STANDARD")}
            >
              <option value="STANDARD">Catálogo (ficha con acceso, calidad, dispositivos…)</option>
              <option value="EVENT">Evento (UFC, Champions, boxeo: texto largo tipo WhatsApp, imagen grande)</option>
            </select>
            <p className="mt-1 text-[11px] leading-snug text-white/45">
              En <strong className="text-white/60">Evento</strong> el bloque “Texto adicional” es el cuerpo principal (emojis, listas de precios, avisos
              de transmisión). El botón de compra sigue siendo solo para este plan y su precio.
            </p>
          </div>

          <PlanPromoImageField
            inputId="pm-image"
            variant="dark"
            value={promoImageUrl}
            onChange={setPromoImageUrl}
            disabled={pending}
            onUploadError={(m) => showSnackbar(m, "error")}
          />

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-title">
              Titular en la tarjeta (opcional)
            </label>
            <input
              id="pm-title"
              className={`${input} mt-1`}
              placeholder="Ej. NETFLIX PREMIUM (si vacío se usa el nombre del plan)"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-access">
              Acceso
            </label>
            <input
              id="pm-access"
              className={`${input} mt-1`}
              placeholder="Ej. Correo y contraseña"
              value={accessSummary}
              onChange={(e) => setAccessSummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-quality">
              Calidad
            </label>
            <input
              id="pm-quality"
              className={`${input} mt-1`}
              placeholder="Ej. 4K Ultra HD"
              value={qualitySummary}
              onChange={(e) => setQualitySummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-dev">
              Dispositivos
            </label>
            <input
              id="pm-dev"
              className={`${input} mt-1`}
              placeholder="Ej. 01 en simultáneo"
              value={devicesSummary}
              onChange={(e) => setDevicesSummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-comp">
              Compatibilidad (opcional)
            </label>
            <input
              id="pm-comp"
              className={`${input} mt-1`}
              placeholder="Ej. Mac, Windows, Android, iOS"
              value={compatibilitySummary}
              onChange={(e) => setCompatibilitySummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-stock">
              Aviso de stock / urgencia (opcional)
            </label>
            <input
              id="pm-stock"
              className={`${input} mt-1`}
              placeholder="Ej. HASTA AGOTAR STOCK"
              value={stockNotice}
              onChange={(e) => setStockNotice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-warn">
              Aviso importante (opcional)
            </label>
            <input
              id="pm-warn"
              className={`${input} mt-1`}
              placeholder="Ej. No incluye instalación"
              value={warningNotice}
              onChange={(e) => setWarningNotice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-extra">
              {cardPresentation === "EVENT"
                ? "Texto del evento (cuerpo principal, como en WhatsApp)"
                : "Texto adicional (listas, otros precios, tiers…)"}
            </label>
            <textarea
              id="pm-extra"
              className={`${input} mt-1 min-h-[180px] font-mono text-[13px] sm:min-h-[220px]`}
              placeholder={
                cardPresentation === "EVENT"
                  ? "Ej. título con emojis, peleadores, precios por plataforma, Discord/Web, avisos EN VIVO, cupos… (todo lo que envías al chat)"
                  : "Ej. líneas como en WhatsApp:\n💎 PERFIL - 1 PANTALLA\n▫️ 30 días → 4.00 PEN\n▫️ 90 días → 10.50 PEN"
              }
              value={extraContent}
              onChange={(e) => setExtraContent(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-mimi-black hover:bg-neutral-200 disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar anuncio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
