import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { PurchaseTierGroupsEditor } from "@/components/admin/PurchaseTierGroupsEditor";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { fetchAuthSession } from "aws-amplify/auth";
import { type FormEvent, useEffect, useState } from "react";
import {
  type AdminTierGroupDraft,
  adminDraftsFromPurchaseCatalog,
  parsePurchaseTierCatalog,
  purchaseTierCatalogFromAdminDrafts,
  stringifyPurchaseTierCatalog,
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
  /** JSON versionado de catálogo de precios (`{ version: 2, groups: [...] }`). Vacío = solo precio/días del registro. */
  purchaseOptionsJson?: string | null;
};

type Props = {
  plan: PlanRecord;
  onCancel: () => void;
  onSaved: () => void;
};

const field =
  "w-full rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm text-mimi-black placeholder:text-mimi-muted";

export function PlanMarketingPanel({ plan, onCancel, onSaved }: Props) {
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
  const [tierGroupDrafts, setTierGroupDrafts] = useState<AdminTierGroupDraft[]>([]);
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
    setTierGroupDrafts(adminDraftsFromPurchaseCatalog(parsePurchaseTierCatalog(plan.purchaseOptionsJson)));
  }, [plan]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchAuthSession({ forceRefresh: true });
      const tierCatalog = purchaseTierCatalogFromAdminDrafts(tierGroupDrafts);
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
          purchaseOptionsJson: tierCatalog ? stringifyPurchaseTierCatalog(tierCatalog) : null,
        },
        { authMode: "userPool" },
      );
      const errText = formatModelErrors(res.errors);
      if (errText) {
        showSnackbar(errText, snackbarVariantForMessage(errText));
        return;
      }
      showSnackbar("Anuncio actualizado.", "success");
      onSaved();
      onCancel();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : "Error al guardar.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-mimi-black/12 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-mimi-black/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-mimi-black">Editar anuncio</h2>
          <p className="mt-0.5 truncate text-xs text-mimi-subtle">
            <strong>{plan.name}</strong> · {plan.durationDays} días · {formatPlanPrice(plan.pricePen)}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-mimi-black/15 px-3 py-1.5 text-xs font-bold text-mimi-subtle hover:border-mimi-black/30 hover:text-mimi-black"
          onClick={onCancel}
        >
          Cerrar editor
        </button>
      </div>

      <form className="grid min-h-0 flex-1 auto-rows-min gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-card-kind">
            Tipo de tarjeta
          </label>
          <select
            id="pm-card-kind"
            className={`${field} mt-1`}
            value={cardPresentation}
            onChange={(e) => setCardPresentation(e.target.value === "EVENT" ? "EVENT" : "STANDARD")}
          >
            <option value="STANDARD">Catálogo (una plataforma)</option>
            <option value="EVENT">Evento (varias opciones en el texto)</option>
          </select>
          <p className="mt-1 text-[11px] leading-snug text-mimi-muted">
            Puedes definir <strong>varias opciones de compra</strong> abajo: el cliente elige precio y vigencia en la tienda. En evento, el texto largo puede
            seguir listando opciones informativas.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-mimi-black/18 bg-mimi-black/[0.02] p-3 sm:col-span-2">
          <p className="text-xs font-bold text-mimi-subtle">Catálogo de precios (tienda y pedido)</p>
          <PurchaseTierGroupsEditor
            value={tierGroupDrafts}
            onChange={setTierGroupDrafts}
            disabled={pending}
            hint="Bloques = tipos de producto; filas = vigencia y PEN. Sin datos válidos se usa el precio base del anuncio."
          />
        </div>

        <div className="sm:col-span-2">
          <PlanPromoImageField
            inputId="pm-image"
            variant="light"
            value={promoImageUrl}
            onChange={setPromoImageUrl}
            disabled={pending}
            onUploadError={(m) => showSnackbar(m, "error")}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-title">
            Titular en la tarjeta
          </label>
          <input
            id="pm-title"
            className={`${field} mt-1`}
            placeholder="Si vacío se usa el nombre del anuncio"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
          />
        </div>

        {cardPresentation === "EVENT" ? (
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-extra">
              Cuerpo del anuncio (evento)
            </label>
            <textarea
              id="pm-extra"
              className={`${field} mt-1 min-h-[160px] font-mono text-[13px] sm:min-h-[200px]`}
              placeholder="Plataformas, precios, horarios, enlaces, cupos…"
              value={extraContent}
              onChange={(e) => setExtraContent(e.target.value)}
            />
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-access">
            Acceso
          </label>
          <input
            id="pm-access"
            className={`${field} mt-1`}
            placeholder="Correo y contraseña…"
            value={accessSummary}
            onChange={(e) => setAccessSummary(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-quality">
            Calidad
          </label>
          <input
            id="pm-quality"
            className={`${field} mt-1`}
            placeholder="4K, Full HD…"
            value={qualitySummary}
            onChange={(e) => setQualitySummary(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-dev">
            Dispositivos
          </label>
          <input
            id="pm-dev"
            className={`${field} mt-1`}
            placeholder="Ej. 01 en simultáneo"
            value={devicesSummary}
            onChange={(e) => setDevicesSummary(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-stock">
            Aviso de stock
          </label>
          <input
            id="pm-stock"
            className={`${field} mt-1`}
            placeholder="HASTA AGOTAR STOCK…"
            value={stockNotice}
            onChange={(e) => setStockNotice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-comp">
            Compatibilidad
          </label>
          <input
            id="pm-comp"
            className={`${field} mt-1`}
            placeholder="Mac, Windows…"
            value={compatibilitySummary}
            onChange={(e) => setCompatibilitySummary(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-warn">
            Aviso importante
          </label>
          <input
            id="pm-warn"
            className={`${field} mt-1`}
            placeholder="No incluye instalación…"
            value={warningNotice}
            onChange={(e) => setWarningNotice(e.target.value)}
          />
        </div>

        {cardPresentation === "STANDARD" ? (
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-extra-standard">
              Texto en la tarjeta (listas de vigencias)
            </label>
            <textarea
              id="pm-extra-standard"
              className={`${field} mt-1 min-h-[120px] font-mono text-[13px] sm:min-h-[160px]`}
              placeholder="▫️ 30 días → S/…"
              value={extraContent}
              onChange={(e) => setExtraContent(e.target.value)}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-mimi-black/8 pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-mimi-black/18 px-4 py-2.5 text-sm font-bold text-mimi-black hover:bg-mimi-black/[0.04]"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-mimi-black px-4 py-2.5 text-sm font-extrabold text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
