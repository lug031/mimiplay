import { PlanMarketingModal, type PlanRecord } from "@/components/admin/PlanMarketingModal";
import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { planRowHasRichMarketing } from "@/lib/planMarketing";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
import {
  type AdminPurchaseOptionRow,
  parsePurchaseOptionsJson,
  purchaseOptionsFromAdminRows,
  stringifyPurchaseOptions,
} from "@/lib/purchaseOptions";
import { fetchAuthSession } from "aws-amplify/auth";
import { type FormEvent, useEffect, useState } from "react";

type Platform = {
  id: string;
  name: string;
  slug: string;
  category: string | null | undefined;
  active: boolean | null | undefined;
};

type ServicePlan = PlanRecord & {
  platformID: string;
  active: boolean | null | undefined;
};

const CATEGORIES = ["STREAMING", "SPORTS", "PC_APP", "OTHER"] as const;

export function AdminCatalogPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [pName, setPName] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState<(typeof CATEGORIES)[number]>("STREAMING");
  const [pSort, setPSort] = useState("");

  const [selectedPlatformId, setSelectedPlatformId] = useState("");
  const [plName, setPlName] = useState("");
  const [plDays, setPlDays] = useState("30");
  const [plPrice, setPlPrice] = useState("");
  const [plVariant, setPlVariant] = useState("");
  const [plPromoUrl, setPlPromoUrl] = useState("");
  const [plCardTitle, setPlCardTitle] = useState("");
  const [plAccess, setPlAccess] = useState("");
  const [plQuality, setPlQuality] = useState("");
  const [plDevices, setPlDevices] = useState("");
  const [plStock, setPlStock] = useState("");
  const [plWarn, setPlWarn] = useState("");
  const [plComp, setPlComp] = useState("");
  const [plExtra, setPlExtra] = useState("");
  const [plCardPresentation, setPlCardPresentation] = useState<"STANDARD" | "EVENT">("STANDARD");
  const [plPoRows, setPlPoRows] = useState<AdminPurchaseOptionRow[]>([]);

  const [marketingPlan, setMarketingPlan] = useState<PlanRecord | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pr, sr] = await Promise.all([
        adminDataClient.models.Platform.list(),
        adminDataClient.models.ServicePlan.list(),
      ]);
      const plats = (pr.data ?? []).filter((x) => x.id).map((x) => x as Platform);
      setPlatforms(plats);
      setPlans((sr.data ?? []).filter((x) => x.id).map((x) => x as unknown as ServicePlan));
      setSelectedPlatformId((prev) => prev || plats[0]?.id || "");
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al cargar", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createPlatform(e: FormEvent) {
    e.preventDefault();
    if (!pName.trim() || !pSlug.trim()) {
      showSnackbar("Nombre y slug son obligatorios.", "warning");
      return;
    }
    const sortParsed = pSort.trim() ? Number.parseInt(pSort, 10) : NaN;
    const sortOrder = Number.isFinite(sortParsed) ? sortParsed : undefined;
    try {
      await fetchAuthSession({ forceRefresh: true });
      const res = await adminDataClient.models.Platform.create(
        {
          name: pName.trim(),
          slug: pSlug.trim().toLowerCase().replace(/\s+/g, "-"),
          description: pDesc.trim() || undefined,
          category: pCategory,
          active: true,
          sortOrder,
        },
        { authMode: "userPool" },
      );
      const errText = formatModelErrors(res.errors);
      if (errText) {
        showSnackbar(errText, snackbarVariantForMessage(errText));
        return;
      }
      if (!res.data?.id) {
        showSnackbar("No se pudo completar la operación. Cierra sesión y vuelve a entrar, o inténtalo más tarde.", "warning");
        return;
      }
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : "Error de red o sesión al crear.", "error");
      return;
    }
    setPName("");
    setPSlug("");
    setPDesc("");
    setPSort("");
    showSnackbar("Plataforma creada.", "success");
    await load();
  }

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    if (!selectedPlatformId) {
      showSnackbar("Selecciona una plataforma.", "warning");
      return;
    }
    if (!plName.trim() || !plPrice) {
      showSnackbar("Nombre del anuncio y precio son obligatorios.", "warning");
      return;
    }
    const purchaseOpts = purchaseOptionsFromAdminRows(plPoRows);
    try {
      await fetchAuthSession({ forceRefresh: true });
      const baseDays = Number.parseInt(plDays, 10) || 30;
      const basePrice = Number.parseFloat(plPrice);
      const firstOpt = purchaseOpts?.[0];
      const res = await adminDataClient.models.ServicePlan.create(
        {
          platformID: selectedPlatformId,
          name: plName.trim(),
          durationDays: firstOpt?.durationDays ?? baseDays,
          pricePen: firstOpt?.pricePen ?? basePrice,
          purchaseOptionsJson:
            purchaseOpts && purchaseOpts.length > 0 ? stringifyPurchaseOptions(purchaseOpts) : undefined,
          planVariantKey: plVariant.trim() || undefined,
          active: true,
          promoImageUrl: plPromoUrl.trim() || undefined,
          cardTitle: plCardTitle.trim() || undefined,
          accessSummary: plAccess.trim() || undefined,
          qualitySummary: plQuality.trim() || undefined,
          devicesSummary: plDevices.trim() || undefined,
          compatibilitySummary: plComp.trim() || undefined,
          stockNotice: plStock.trim() || undefined,
          warningNotice: plWarn.trim() || undefined,
          extraContent: plExtra.trim() || undefined,
          cardPresentation: plCardPresentation,
        },
        { authMode: "userPool" },
      );
      const errText = formatModelErrors(res.errors);
      if (errText) {
        showSnackbar(errText, snackbarVariantForMessage(errText));
        return;
      }
      if (!res.data?.id) {
        showSnackbar("No se pudo completar la operación. Actualiza la página o vuelve a iniciar sesión.", "warning");
        return;
      }
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : "Error de red o sesión al crear.", "error");
      return;
    }
    setPlName("");
    setPlPrice("");
    setPlVariant("");
    setPlPromoUrl("");
    setPlCardTitle("");
    setPlAccess("");
    setPlQuality("");
    setPlDevices("");
    setPlStock("");
    setPlWarn("");
    setPlComp("");
    setPlExtra("");
    setPlCardPresentation("STANDARD");
    setPlPoRows([]);
    showSnackbar("Anuncio creado.", "success");
    await load();
  }

  async function togglePlatformActive(p: Platform) {
    try {
      await adminDataClient.models.Platform.update({
        id: p.id,
        active: !(p.active !== false),
      });
      showSnackbar(p.active === false ? "Plataforma activada." : "Plataforma desactivada.", "success");
      await load();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al actualizar plataforma", "error");
    }
  }

  async function togglePlanActive(pl: ServicePlan) {
    try {
      await adminDataClient.models.ServicePlan.update({
        id: pl.id,
        active: !(pl.active !== false),
      });
      showSnackbar(pl.active === false ? "Anuncio activado." : "Anuncio desactivado.", "success");
      await load();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al actualizar anuncio", "error");
    }
  }

  return (
    <div>
      {marketingPlan ? (
        <PlanMarketingModal
          plan={marketingPlan}
          onClose={() => setMarketingPlan(null)}
          onSaved={() => void load()}
        />
      ) : null}

      <h1 className="text-2xl font-extrabold text-mimi-black">Catálogo</h1>
      <p className="mt-2 text-sm text-mimi-subtle">
        Cada <strong>anuncio</strong> puede tener un solo precio o <strong>varias opciones</strong> (perfil 30d, cuenta 90d, etc.): el cliente elige en la tienda y
        en el pedido. La <strong>tarjeta</strong> lleva imagen y textos. Los <strong>eventos</strong> suelen listar opciones informativas en el texto; puedes
        editar presentación y precios con <strong>Presentación</strong> en la lista.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-mimi-subtle">
        <li>
          <strong>Plataforma:</strong> nombre, slug (ej.{" "}
          <code className="rounded bg-mimi-black/[0.06] px-1">netflix</code>), categoría.
        </li>
        <li>
          <strong>Anuncio:</strong> plataforma, nombre, días y precio base; opcionalmente añade filas de <strong>opciones de compra</strong> para que el cliente
          elija en el catálogo.
        </li>
      </ol>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-4" />}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-mimi-black">Nueva plataforma</h2>
          <form className="mt-4 space-y-3" onSubmit={createPlatform}>
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              placeholder="Nombre (ej. Netflix)"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              placeholder="Slug (ej. netflix)"
              value={pSlug}
              onChange={(e) => setPSlug(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              placeholder="Descripción"
              rows={2}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              value={pCategory}
              onChange={(e) => setPCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              placeholder="Orden (número)"
              value={pSort}
              onChange={(e) => setPSort(e.target.value)}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
            >
              Crear plataforma
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-mimi-black">Nuevo anuncio</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createPlan}>
            <select
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
            >
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Nombre del anuncio (ej. Perfil 1 pantalla 30d)"
              value={plName}
              onChange={(e) => setPlName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              type="number"
              min={1}
              placeholder="Días de vigencia"
              value={plDays}
              onChange={(e) => setPlDays(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              type="number"
              step="0.01"
              min={0}
              placeholder="Precio (PEN)"
              value={plPrice}
              onChange={(e) => setPlPrice(e.target.value)}
            />
            <div className="space-y-2 rounded-lg border border-dashed border-mimi-black/18 bg-mimi-black/[0.02] p-3 sm:col-span-2">
              <p className="text-xs font-bold text-mimi-subtle">Opciones de compra (opcional)</p>
              <p className="text-[11px] leading-snug text-mimi-muted">
                Si añades filas válidas, el cliente elige una en el catálogo y en el pedido. La primera fila válida actualiza también los días y precio base del
                registro.
              </p>
              {plPoRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-mimi-black/10 bg-white px-2 py-2">
                  <input
                    className="w-24 min-w-0 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                    placeholder="id"
                    title="Opcional; si vacío se genera desde la etiqueta"
                    value={row.id}
                    onChange={(e) => {
                      const next = [...plPoRows];
                      next[i] = { ...next[i]!, id: e.target.value };
                      setPlPoRows(next);
                    }}
                  />
                  <input
                    className="min-w-[8rem] flex-1 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                    placeholder="Etiqueta (ej. Perfil 30 días)"
                    value={row.label}
                    onChange={(e) => {
                      const next = [...plPoRows];
                      next[i] = { ...next[i]!, label: e.target.value };
                      setPlPoRows(next);
                    }}
                  />
                  <input
                    className="w-20 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                    type="number"
                    min={1}
                    placeholder="Días"
                    value={row.days}
                    onChange={(e) => {
                      const next = [...plPoRows];
                      next[i] = { ...next[i]!, days: e.target.value };
                      setPlPoRows(next);
                    }}
                  />
                  <input
                    className="w-24 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="PEN"
                    value={row.price}
                    onChange={(e) => {
                      const next = [...plPoRows];
                      next[i] = { ...next[i]!, price: e.target.value };
                      setPlPoRows(next);
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-full border border-mimi-black/15 px-2 py-1 text-[11px] font-bold text-mimi-subtle hover:border-red-300 hover:text-red-800"
                    onClick={() => setPlPoRows(plPoRows.filter((_, j) => j !== i))}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-bold text-mimi-black underline decoration-mimi-black/25 underline-offset-2 hover:decoration-mimi-black"
                onClick={() => setPlPoRows([...plPoRows, { id: "", label: "", days: "", price: "" }])}
              >
                + Añadir opción de precio
              </button>
            </div>
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Clave de variante (ej. PROFILE_1)"
              value={plVariant}
              onChange={(e) => setPlVariant(e.target.value)}
            />

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-mimi-subtle" htmlFor="new-plan-card-kind">
                Tipo de tarjeta
              </label>
              <select
                id="new-plan-card-kind"
                className="mt-1 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                value={plCardPresentation}
                onChange={(e) => setPlCardPresentation(e.target.value === "EVENT" ? "EVENT" : "STANDARD")}
              >
                <option value="STANDARD">Catálogo (una plataforma)</option>
                <option value="EVENT">Evento (varias opciones en el texto)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <PlanPromoImageField
                inputId="new-plan-promo-image"
                variant="light"
                value={plPromoUrl}
                onChange={setPlPromoUrl}
                onUploadError={(m) => showSnackbar(m, "error")}
              />
            </div>
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Titular en la tarjeta"
              value={plCardTitle}
              onChange={(e) => setPlCardTitle(e.target.value)}
            />
            {plCardPresentation === "EVENT" ? (
              <textarea
                className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
                rows={8}
                placeholder="Cuerpo del anuncio: horarios, plataformas (Movistar, Disney+, IPTV…), precios informativos, enlaces, avisos…"
                value={plExtra}
                onChange={(e) => setPlExtra(e.target.value)}
              />
            ) : null}
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              placeholder="Acceso"
              value={plAccess}
              onChange={(e) => setPlAccess(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
              placeholder="Calidad"
              value={plQuality}
              onChange={(e) => setPlQuality(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Dispositivos"
              value={plDevices}
              onChange={(e) => setPlDevices(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Aviso de stock"
              value={plStock}
              onChange={(e) => setPlStock(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Compatibilidad"
              value={plComp}
              onChange={(e) => setPlComp(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Aviso importante"
              value={plWarn}
              onChange={(e) => setPlWarn(e.target.value)}
            />
            {plCardPresentation === "STANDARD" ? (
              <textarea
                className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
                rows={4}
                placeholder="Listas de vigencias y precios en la tarjeta (▫️ 30 días → S/…)"
                value={plExtra}
                onChange={(e) => setPlExtra(e.target.value)}
              />
            ) : null}
            <button
              type="submit"
              className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800 sm:col-span-2"
            >
              Crear anuncio
            </button>
          </form>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-extrabold text-mimi-black">Plataformas existentes</h2>
        <ul className="mt-4 space-y-2">
          {platforms.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm"
            >
              <span>
                <strong>{p.name}</strong> <span className="text-mimi-muted">({p.slug})</span> —{" "}
                {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "—"}
              </span>
              <button
                type="button"
                className="rounded-full border border-mimi-black/12 px-3 py-1 text-xs font-bold hover:border-mimi-black/35"
                onClick={() => void togglePlatformActive(p)}
              >
                {p.active === false ? "Activar" : "Desactivar"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold text-mimi-black">Anuncios</h2>
        <ul className="mt-4 space-y-2">
          {plans.map((pl) => {
            const plat = platforms.find((x) => x.id === pl.platformID);
            const nPurchaseOpts = parsePurchaseOptionsJson(
              (pl as { purchaseOptionsJson?: string | null }).purchaseOptionsJson,
            )?.length;
            return (
              <li
                key={pl.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span>
                    <strong>{plat?.name ?? "?"}</strong> — {pl.name} · {pl.durationDays}d · {formatPlanPrice(pl.pricePen)}
                  </span>
                  {nPurchaseOpts && nPurchaseOpts > 1 ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sky-900">
                      {nPurchaseOpts} opciones
                    </span>
                  ) : null}
                  {pl.cardPresentation === "EVENT" ? (
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-orange-900">
                      Tarjeta evento
                    </span>
                  ) : null}
                  {!planRowHasRichMarketing(pl) ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                      Sin ficha / imagen
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-mimi-black/18 bg-mimi-black/[0.04] px-3 py-1 text-xs font-bold text-mimi-black hover:border-mimi-black/35"
                    onClick={() => setMarketingPlan(pl)}
                  >
                    Presentación
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-mimi-black/12 px-3 py-1 text-xs font-bold hover:border-mimi-black/35"
                    onClick={() => void togglePlanActive(pl)}
                  >
                    {pl.active === false ? "Activar" : "Desactivar"}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
