import { PlanMarketingPanel, type PlanRecord } from "@/components/admin/PlanMarketingModal";
import { PurchaseTierGroupsEditor } from "@/components/admin/PurchaseTierGroupsEditor";
import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { planRowHasRichMarketing } from "@/lib/planMarketing";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
import {
  type AdminTierGroupDraft,
  emptyAdminTierGroup,
  firstTierInCatalog,
  parsePurchaseTierCatalog,
  purchaseTierCatalogFromAdminDrafts,
  stringifyPurchaseTierCatalog,
  totalTierCount,
} from "@/lib/purchaseOptions";
import { fetchAuthSession } from "aws-amplify/auth";
import { type FormEvent, useEffect, useMemo, useState } from "react";

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

type MainTab = "platforms" | "plans";
type PlanWorkspace = "create" | "edit";

const tabBtn =
  "rounded-full px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mimi-black";
const tabBtnActive = "bg-mimi-black text-white shadow-sm";
const tabBtnIdle = "text-mimi-subtle hover:bg-mimi-black/[0.06] hover:text-mimi-black";

export function AdminCatalogPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState<MainTab>("plans");
  const [planWorkspace, setPlanWorkspace] = useState<PlanWorkspace>("create");
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<ServicePlan | null>(null);
  const [planListQuery, setPlanListQuery] = useState("");

  const [pName, setPName] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState<(typeof CATEGORIES)[number]>("STREAMING");
  const [pSort, setPSort] = useState("");

  const [selectedPlatformId, setSelectedPlatformId] = useState("");
  const [plName, setPlName] = useState("");
  const [plVariant, setPlVariant] = useState("");
  const [plPromoUrl, setPlPromoUrl] = useState("");
  const [plCardTitle, setPlCardTitle] = useState("");
  const [plServiceDetails, setPlServiceDetails] = useState("");
  const [plStock, setPlStock] = useState("");
  const [plWarn, setPlWarn] = useState("");
  const [plExtra, setPlExtra] = useState("");
  const [plCardPresentation, setPlCardPresentation] = useState<"STANDARD" | "EVENT">("STANDARD");
  const [tierGroupDrafts, setTierGroupDrafts] = useState<AdminTierGroupDraft[]>(() => [emptyAdminTierGroup()]);

  const filteredPlans = useMemo(() => {
    const q = planListQuery.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((pl) => {
      const plat = platforms.find((x) => x.id === pl.platformID);
      const hay = `${plat?.name ?? ""} ${pl.name} ${pl.planVariantKey ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [plans, platforms, planListQuery]);

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
      setSelectedPlanForEdit((prev) => {
        if (!prev?.id) return prev;
        const fresh = (sr.data ?? []).find((x) => x.id === prev.id) as unknown as ServicePlan | undefined;
        return fresh ?? null;
      });
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
    if (!plName.trim()) {
      showSnackbar("El nombre interno del anuncio es obligatorio.", "warning");
      return;
    }
    const tierCatalog = purchaseTierCatalogFromAdminDrafts(tierGroupDrafts);
    const firstTier = tierCatalog ? firstTierInCatalog(tierCatalog) : null;
    if (!tierCatalog || !firstTier) {
      showSnackbar("Define al menos un bloque de precios con una fila válida (etiqueta, días y PEN).", "warning");
      return;
    }
    try {
      await fetchAuthSession({ forceRefresh: true });
      const res = await adminDataClient.models.ServicePlan.create(
        {
          platformID: selectedPlatformId,
          name: plName.trim(),
          durationDays: firstTier.durationDays,
          pricePen: firstTier.pricePen,
          purchaseOptionsJson: stringifyPurchaseTierCatalog(tierCatalog),
          planVariantKey: plVariant.trim() || undefined,
          active: true,
          promoImageUrl: plPromoUrl.trim() || undefined,
          cardTitle: plCardTitle.trim() || undefined,
          accessSummary: plServiceDetails.trim() || undefined,
          stockNotice: plStock.trim() || undefined,
          warningNotice: plWarn.trim() || undefined,
          extraContent: plCardPresentation === "EVENT" ? plExtra.trim() || undefined : undefined,
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
    setPlVariant("");
    setPlPromoUrl("");
    setPlCardTitle("");
    setPlServiceDetails("");
    setPlStock("");
    setPlWarn("");
    setPlExtra("");
    setPlCardPresentation("STANDARD");
    setTierGroupDrafts([emptyAdminTierGroup()]);
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

  function openPlanEditor(pl: ServicePlan) {
    setSelectedPlanForEdit(pl);
    setPlanWorkspace("edit");
  }

  const editingPlan =
    selectedPlanForEdit && plans.some((p) => p.id === selectedPlanForEdit.id)
      ? (plans.find((p) => p.id === selectedPlanForEdit.id) ?? selectedPlanForEdit)
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-mimi-black/10 pb-5">
        <h1 className="text-2xl font-extrabold text-mimi-black">Catálogo</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mimi-subtle">
          Gestiona <strong>plataformas</strong> y <strong>anuncios</strong>. Cada anuncio puede llevar una sola tarifa o varias <strong>opciones de compra</strong>{" "}
          (perfil 30d, cuenta 90d…). La columna derecha es el área de trabajo para <strong>dar de alta</strong> o <strong>editar</strong> anuncios, sin ventanas emergentes.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${tabBtn} ${mainTab === "platforms" ? tabBtnActive : tabBtnIdle}`}
            onClick={() => setMainTab("platforms")}
          >
            Plataformas
          </button>
          <button
            type="button"
            className={`${tabBtn} ${mainTab === "plans" ? tabBtnActive : tabBtnIdle}`}
            onClick={() => setMainTab("plans")}
          >
            Anuncios
          </button>
        </div>
      </header>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-6" />}

      {!loading && mainTab === "platforms" ? (
        <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
          <aside className="flex min-h-[320px] flex-col rounded-2xl border border-mimi-black/12 bg-mimi-black/[0.02] lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)]">
            <div className="border-b border-mimi-black/10 px-4 py-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-mimi-subtle">Listado</h2>
              <p className="mt-1 text-xs text-mimi-muted">{platforms.length} plataforma(s)</p>
            </div>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {platforms.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-mimi-black/10 bg-white px-3 py-2.5 text-sm shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-mimi-black">{p.name}</p>
                      <p className="text-xs text-mimi-muted">
                        <span className="font-mono">{p.slug}</span>
                        {" · "}
                        {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "—"}
                      </p>
                      {p.active === false ? (
                        <span className="mt-1 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-neutral-700">
                          Inactiva
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-full border border-mimi-black/12 px-3 py-1 text-xs font-bold hover:border-mimi-black/35"
                      onClick={() => void togglePlatformActive(p)}
                    >
                      {p.active === false ? "Activar" : "Desactivar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <section className="rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-mimi-black">Nueva plataforma</h2>
            <p className="mt-1 text-xs text-mimi-muted">Nombre, slug (ej. netflix) y categoría. El listado queda a la izquierda.</p>
            <form className="mt-5 space-y-3" onSubmit={createPlatform}>
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
                className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800 sm:w-auto sm:px-10"
              >
                Crear plataforma
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {!loading && mainTab === "plans" ? (
        <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(280px,400px)_1fr] lg:items-stretch">
          <aside className="flex min-h-[360px] flex-col rounded-2xl border border-mimi-black/12 bg-mimi-black/[0.02] lg:max-h-[calc(100vh-8rem)] lg:sticky lg:top-4">
            <div className="border-b border-mimi-black/10 px-4 py-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-mimi-subtle">Anuncios</h2>
              <input
                type="search"
                className="mt-2 w-full rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm"
                placeholder="Buscar por plataforma o nombre…"
                value={planListQuery}
                onChange={(e) => setPlanListQuery(e.target.value)}
                aria-label="Buscar anuncios"
              />
              <p className="mt-2 text-xs text-mimi-muted">
                {filteredPlans.length} de {plans.length} resultado(s)
              </p>
            </div>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {filteredPlans.map((pl) => {
                const plat = platforms.find((x) => x.id === pl.platformID);
                const nTiers = totalTierCount(
                  parsePurchaseTierCatalog((pl as { purchaseOptionsJson?: string | null }).purchaseOptionsJson),
                );
                const isSelected = selectedPlanForEdit?.id === pl.id && planWorkspace === "edit";
                return (
                  <li
                    key={pl.id}
                    className={`rounded-xl border px-3 py-2.5 text-sm shadow-sm transition-colors ${
                      isSelected ? "border-mimi-black/40 bg-white ring-1 ring-mimi-black/15" : "border-mimi-black/10 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-mimi-black">
                          {plat?.name ?? "?"} — {pl.name}
                        </p>
                        <p className="text-xs text-mimi-muted">
                          {pl.durationDays}d · {formatPlanPrice(pl.pricePen)}
                          {pl.active === false ? " · inactivo" : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {nTiers > 1 ? (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sky-900">
                              {nTiers} opciones
                            </span>
                          ) : null}
                          {pl.cardPresentation === "EVENT" ? (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-orange-900">
                              Evento
                            </span>
                          ) : null}
                          {!planRowHasRichMarketing(pl) ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                              Sin ficha
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-mimi-black/18 bg-mimi-black/[0.04] px-3 py-1 text-xs font-bold text-mimi-black hover:border-mimi-black/35"
                          onClick={() => openPlanEditor(pl)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-mimi-black/12 px-3 py-1 text-xs font-bold hover:border-mimi-black/35"
                          onClick={() => void togglePlanActive(pl)}
                        >
                          {pl.active === false ? "Activar" : "Desactivar"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="flex min-h-[480px] min-w-0 flex-col gap-4">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-mimi-black/10 bg-white p-2 shadow-sm">
              <button
                type="button"
                className={`${tabBtn} ${planWorkspace === "create" ? tabBtnActive : tabBtnIdle}`}
                onClick={() => {
                  setPlanWorkspace("create");
                  setSelectedPlanForEdit(null);
                }}
              >
                Nuevo anuncio
              </button>
              <button
                type="button"
                className={`${tabBtn} ${planWorkspace === "edit" ? tabBtnActive : tabBtnIdle}`}
                onClick={() => {
                  if (!editingPlan) {
                    showSnackbar("Selecciona un anuncio en la lista y pulsa «Editar».", "warning");
                    return;
                  }
                  setPlanWorkspace("edit");
                }}
              >
                Editar
                {editingPlan ? (
                  <span className="ml-1 max-w-[140px] truncate font-normal opacity-80">· {editingPlan.name}</span>
                ) : null}
              </button>
            </div>

            {planWorkspace === "edit" && editingPlan ? (
              <div className="min-h-0 flex-1 lg:max-h-[calc(100vh-10rem)]">
                <PlanMarketingPanel
                  plan={editingPlan}
                  onCancel={() => {
                    setSelectedPlanForEdit(null);
                    setPlanWorkspace("create");
                  }}
                  onSaved={() => void load()}
                />
              </div>
            ) : null}

            {planWorkspace === "edit" && !editingPlan ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-mimi-black/15 bg-mimi-black/[0.02] px-6 py-16 text-center">
                <p className="text-sm font-bold text-mimi-black">Ningún anuncio seleccionado</p>
                <p className="mt-2 max-w-sm text-xs text-mimi-muted">
                  En la lista de la izquierda, pulsa <strong>Editar</strong> en el anuncio que quieras modificar (imagen, textos y opciones de precio en tienda).
                </p>
              </div>
            ) : null}

            {planWorkspace === "create" ? (
              <section className="rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-extrabold text-mimi-black">Alta de anuncio</h2>
                <p className="mt-1 text-xs text-mimi-muted">
                  El precio y los días del registro base se toman de la <strong>primera fila válida</strong> del catálogo de precios (misma lógica que la tienda).
                </p>
                <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={createPlan}>
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
                    placeholder="Nombre interno del anuncio (listado admin)"
                    value={plName}
                    onChange={(e) => setPlName(e.target.value)}
                  />
                  <div className="rounded-lg border border-dashed border-mimi-black/18 bg-mimi-black/[0.02] p-3 sm:col-span-2">
                    <p className="text-xs font-bold text-mimi-subtle">Catálogo de precios (obligatorio)</p>
                    <PurchaseTierGroupsEditor
                      value={tierGroupDrafts}
                      onChange={setTierGroupDrafts}
                      hint="Cada bloque es un tipo de producto (ej. PERFIL vs CUENTA). Cada fila: etiqueta visible, días y precio PEN. Los ids internos se generan al guardar."
                    />
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
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-mimi-subtle" htmlFor="new-plan-card-title">
                      Titular en la tarjeta
                    </label>
                    <input
                      id="new-plan-card-title"
                      className="mt-1 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                      placeholder="Ej. cómo verá el cliente el nombre del servicio"
                      value={plCardTitle}
                      onChange={(e) => setPlCardTitle(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-mimi-subtle" htmlFor="new-plan-service-details">
                      Detalles del servicio
                    </label>
                    <textarea
                      id="new-plan-service-details"
                      className="mt-1 min-h-[120px] w-full rounded-lg border border-mimi-black/12 px-3 py-2 font-mono text-sm sm:min-h-[140px]"
                      placeholder={"Acceso: Correo y contraseña\nCalidad: 4K Ultra HD\nDispositivos: 01 en simultáneo"}
                      value={plServiceDetails}
                      onChange={(e) => setPlServiceDetails(e.target.value)}
                    />
                  </div>
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
                    className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
                    placeholder="Aviso de stock"
                    value={plStock}
                    onChange={(e) => setPlStock(e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm sm:col-span-2"
                    placeholder="Aviso importante"
                    value={plWarn}
                    onChange={(e) => setPlWarn(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800 sm:col-span-2 sm:w-auto sm:px-10"
                  >
                    Crear anuncio
                  </button>
                </form>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
