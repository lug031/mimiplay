import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { fetchAuthSession } from "aws-amplify/auth";
import { type FormEvent, useEffect, useState } from "react";
import {
  type AdminPurchaseOptionRow,
  adminRowsFromPurchaseOptions,
  parsePurchaseOptionsJson,
  purchaseOptionsFromAdminRows,
  stringifyPurchaseOptions,
} from "@/lib/purchaseOptions";

/** Registro de anuncio en admin (modelo API ServicePlan). */
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
  /** JSON de opciones de compra; vacío = solo precio/días del registro. */
  purchaseOptionsJson?: string | null;
};

type Props = {
  plan: PlanRecord;
  onClose: () => void;
  onSaved: () => void;
};

const input =
  "w-full rounded-lg border border-white/25 bg-white px-3 py-2 text-sm text-mimi-black placeholder:text-mimi-muted";

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
  const [poRows, setPoRows] = useState<AdminPurchaseOptionRow[]>([]);
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
    setPoRows(adminRowsFromPurchaseOptions(parsePurchaseOptionsJson(plan.purchaseOptionsJson)));
  }, [plan]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchAuthSession({ forceRefresh: true });
      const purchaseOpts = purchaseOptionsFromAdminRows(poRows);
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
          purchaseOptionsJson:
            purchaseOpts && purchaseOpts.length > 0 ? stringifyPurchaseOptions(purchaseOpts) : null,
        },
        { authMode: "userPool" },
      );
      const errText = formatModelErrors(res.errors);
      if (errText) {
        showSnackbar(errText, snackbarVariantForMessage(errText));
        return;
      }
      showSnackbar("Presentación guardada.", "success");
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
            Presentación del anuncio
          </h2>
          <button type="button" className="rounded-lg px-2 py-1 text-sm font-bold text-white/70 hover:bg-white/10" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="grid gap-3 px-4 py-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <p className="text-xs leading-relaxed text-white/60 sm:col-span-2">
            <strong className="text-white">{plan.name}</strong> · {plan.durationDays} días · {formatPlanPrice(plan.pricePen)} (precio al comprar en la tienda).
          </p>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-card-kind">
              Tipo de tarjeta
            </label>
            <select
              id="pm-card-kind"
              className={`${input} mt-1`}
              value={cardPresentation}
              onChange={(e) => setCardPresentation(e.target.value === "EVENT" ? "EVENT" : "STANDARD")}
            >
              <option value="STANDARD">Catálogo (una plataforma)</option>
              <option value="EVENT">Evento (varias opciones en el texto)</option>
            </select>
            <p className="mt-1 text-[11px] leading-snug text-white/45">
              Puedes definir <strong className="text-white/60">varias opciones de compra</strong> abajo: el cliente elige precio y vigencia en la tienda. En
              evento, el texto largo puede seguir listando opciones informativas.
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-white/12 bg-mimi-black/35 p-3 sm:col-span-2">
            <p className="text-xs font-bold text-white/75">Opciones de compra (precio en tienda)</p>
            <p className="text-[11px] leading-snug text-white/45">
              Filas vacías o incompletas se ignoran. Sin filas válidas se usa solo el precio y días del anuncio.
            </p>
            {poRows.map((row, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-mimi-black/40 px-2 py-2">
                <input
                  className="w-24 min-w-0 rounded border border-white/15 bg-white px-2 py-1.5 text-xs text-mimi-black"
                  placeholder="id"
                  disabled={pending}
                  value={row.id}
                  onChange={(e) => {
                    const next = [...poRows];
                    next[i] = { ...next[i]!, id: e.target.value };
                    setPoRows(next);
                  }}
                />
                <input
                  className="min-w-[8rem] flex-1 rounded border border-white/15 bg-white px-2 py-1.5 text-xs text-mimi-black"
                  placeholder="Etiqueta"
                  disabled={pending}
                  value={row.label}
                  onChange={(e) => {
                    const next = [...poRows];
                    next[i] = { ...next[i]!, label: e.target.value };
                    setPoRows(next);
                  }}
                />
                <input
                  className="w-20 rounded border border-white/15 bg-white px-2 py-1.5 text-xs text-mimi-black"
                  type="number"
                  min={1}
                  placeholder="Días"
                  disabled={pending}
                  value={row.days}
                  onChange={(e) => {
                    const next = [...poRows];
                    next[i] = { ...next[i]!, days: e.target.value };
                    setPoRows(next);
                  }}
                />
                <input
                  className="w-24 rounded border border-white/15 bg-white px-2 py-1.5 text-xs text-mimi-black"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="PEN"
                  disabled={pending}
                  value={row.price}
                  onChange={(e) => {
                    const next = [...poRows];
                    next[i] = { ...next[i]!, price: e.target.value };
                    setPoRows(next);
                  }}
                />
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-full border border-white/20 px-2 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10 disabled:opacity-50"
                  onClick={() => setPoRows(poRows.filter((_, j) => j !== i))}
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={pending}
              className="text-xs font-bold text-white/80 underline decoration-white/30 underline-offset-2 hover:decoration-white disabled:opacity-50"
              onClick={() => setPoRows([...poRows, { id: "", label: "", days: "", price: "" }])}
            >
              + Añadir opción
            </button>
          </div>

          <div className="sm:col-span-2">
            <PlanPromoImageField
              inputId="pm-image"
              variant="dark"
              value={promoImageUrl}
              onChange={setPromoImageUrl}
              disabled={pending}
              onUploadError={(m) => showSnackbar(m, "error")}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-title">
              Titular en la tarjeta
            </label>
            <input
              id="pm-title"
              className={`${input} mt-1`}
              placeholder="Si vacío se usa el nombre del anuncio"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
            />
          </div>

          {cardPresentation === "EVENT" ? (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-white/70" htmlFor="pm-extra">
                Cuerpo del anuncio (evento)
              </label>
              <textarea
                id="pm-extra"
                className={`${input} mt-1 min-h-[160px] font-mono text-[13px] sm:min-h-[200px]`}
                placeholder="Plataformas, precios, horarios, enlaces, cupos…"
                value={extraContent}
                onChange={(e) => setExtraContent(e.target.value)}
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-access">
              Acceso
            </label>
            <input
              id="pm-access"
              className={`${input} mt-1`}
              placeholder="Correo y contraseña…"
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
              placeholder="4K, Full HD…"
              value={qualitySummary}
              onChange={(e) => setQualitySummary(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-stock">
              Aviso de stock
            </label>
            <input
              id="pm-stock"
              className={`${input} mt-1`}
              placeholder="HASTA AGOTAR STOCK…"
              value={stockNotice}
              onChange={(e) => setStockNotice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-comp">
              Compatibilidad
            </label>
            <input
              id="pm-comp"
              className={`${input} mt-1`}
              placeholder="Mac, Windows…"
              value={compatibilitySummary}
              onChange={(e) => setCompatibilitySummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70" htmlFor="pm-warn">
              Aviso importante
            </label>
            <input
              id="pm-warn"
              className={`${input} mt-1`}
              placeholder="No incluye instalación…"
              value={warningNotice}
              onChange={(e) => setWarningNotice(e.target.value)}
            />
          </div>

          {cardPresentation === "STANDARD" ? (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-white/70" htmlFor="pm-extra-standard">
                Texto en la tarjeta (listas de vigencias)
              </label>
              <textarea
                id="pm-extra-standard"
                className={`${input} mt-1 min-h-[120px] font-mono text-[13px] sm:min-h-[160px]`}
                placeholder="▫️ 30 días → S/…"
                value={extraContent}
                onChange={(e) => setExtraContent(e.target.value)}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
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
              className="rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-mimi-black hover:bg-mimi-muted/40 disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
