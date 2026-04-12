import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { PurchaseTierGroupsEditor } from "@/components/admin/PurchaseTierGroupsEditor";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { composeServiceDetailsForEditor } from "@/lib/planMarketing";
import { fetchAuthSession } from "aws-amplify/auth";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  type AdminTierGroupDraft,
  adminDraftsFromPurchaseCatalog,
  firstTierInCatalog,
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
  const [serviceDetails, setServiceDetails] = useState("");
  const [stockNotice, setStockNotice] = useState("");
  const [warningNotice, setWarningNotice] = useState("");
  const [extraContent, setExtraContent] = useState("");
  const [cardPresentation, setCardPresentation] = useState<"STANDARD" | "EVENT">("STANDARD");
  const [tierGroupDrafts, setTierGroupDrafts] = useState<AdminTierGroupDraft[]>([]);
  const [pending, setPending] = useState(false);

  const catalogParsed = useMemo(() => parsePurchaseTierCatalog(plan.purchaseOptionsJson), [plan.purchaseOptionsJson]);
  const headerTier = useMemo(() => firstTierInCatalog(catalogParsed), [catalogParsed]);

  useEffect(() => {
    setPromoImageUrl(plan.promoImageUrl ?? "");
    setCardTitle(plan.cardTitle ?? "");
    setServiceDetails(composeServiceDetailsForEditor(plan));
    setStockNotice(plan.stockNotice ?? "");
    setWarningNotice(plan.warningNotice ?? "");
    setExtraContent(plan.extraContent ?? "");
    setCardPresentation(plan.cardPresentation === "EVENT" ? "EVENT" : "STANDARD");
    setTierGroupDrafts(adminDraftsFromPurchaseCatalog(catalogParsed));
  }, [plan, catalogParsed]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchAuthSession({ forceRefresh: true });
      const tierCatalog = purchaseTierCatalogFromAdminDrafts(tierGroupDrafts);
      const first = tierCatalog ? firstTierInCatalog(tierCatalog) : null;
      const res = await adminDataClient.models.ServicePlan.update(
        {
          id: plan.id,
          cardPresentation,
          durationDays: first?.durationDays ?? plan.durationDays,
          pricePen: first?.pricePen ?? plan.pricePen,
          promoImageUrl: promoImageUrl.trim() || undefined,
          cardTitle: cardTitle.trim() || undefined,
          accessSummary: serviceDetails.trim() || undefined,
          qualitySummary: null,
          devicesSummary: null,
          compatibilitySummary: null,
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
            <strong>{plan.name}</strong>
            {headerTier ? (
              <>
                {" "}
                · {headerTier.durationDays} días · {formatPlanPrice(headerTier.pricePen)}
              </>
            ) : (
              <>
                {" "}
                · {plan.durationDays} días · {formatPlanPrice(plan.pricePen)}
              </>
            )}
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
            Las <strong>opciones de compra</strong> (precio y vigencia) se definen solo en el catálogo de precios siguiente; el cliente elige en la tienda.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-mimi-black/18 bg-mimi-black/[0.02] p-3 sm:col-span-2">
          <p className="text-xs font-bold text-mimi-subtle">Catálogo de precios (tienda y pedido)</p>
          <PurchaseTierGroupsEditor
            value={tierGroupDrafts}
            onChange={setTierGroupDrafts}
            disabled={pending}
            hint="Bloques = tipos de producto; cada fila = etiqueta visible, días de vigencia y precio en PEN. Los identificadores internos se asignan al guardar."
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
            placeholder="Ej. nombre del servicio como lo verá el cliente"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-mimi-muted">Si lo dejas vacío, en la tienda se usa el nombre interno del anuncio.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-mimi-subtle" htmlFor="pm-service-details">
            Detalles del servicio
          </label>
          <textarea
            id="pm-service-details"
            className={`${field} mt-1 min-h-[140px] whitespace-pre-wrap font-mono text-[13px] sm:min-h-[180px]`}
            placeholder={"Acceso: Correo y contraseña\nCalidad: 4K Ultra HD\nDispositivos: 01 en simultáneo"}
            value={serviceDetails}
            onChange={(e) => setServiceDetails(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-mimi-muted">
            Un solo texto: acceso, calidad, dispositivos, compatibilidad, etc. Se muestra en la ficha tal como lo escribes (puedes usar varias líneas).
          </p>
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

        <div className="sm:col-span-2">
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
