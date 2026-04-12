import { PlanMarketingModal, type PlanRecord } from "@/components/admin/PlanMarketingModal";
import { PlanPromoImageField } from "@/components/admin/PlanPromoImageField";
import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { adminDataClient } from "@/lib/dataClient";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { formatModelErrors } from "@/lib/modelErrors";
import { planRowHasRichMarketing } from "@/lib/planMarketing";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
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
      showSnackbar("Nombre y precio son obligatorios.", "warning");
      return;
    }
    try {
      await fetchAuthSession({ forceRefresh: true });
      const res = await adminDataClient.models.ServicePlan.create(
        {
          platformID: selectedPlatformId,
          name: plName.trim(),
          durationDays: Number.parseInt(plDays, 10) || 30,
          pricePen: Number.parseFloat(plPrice),
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
    showSnackbar("Plan creado.", "success");
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
      showSnackbar(pl.active === false ? "Plan activado." : "Plan desactivado.", "success");
      await load();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al actualizar plan", "error");
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

      <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
      <p className="mt-2 text-sm text-slate-600">
        Los formularios de abajo crean la <strong>ficha técnica del producto</strong> (plataforma + plan con precio y días). Lo que antes enviabas por
        WhatsApp (titular, acceso, calidad, imagen, “hasta agotar stock”, etc.) se registra en el paso <strong>Anuncio (WhatsApp)</strong> de cada plan,
        o de forma opcional al crear el plan en el bloque desplegable.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>
          <strong>Nueva plataforma:</strong> nombre comercial (ej. Netflix), slug único (ej.{" "}
          <code className="rounded bg-slate-100 px-1">netflix</code>), categoría y descripción si quieres.
        </li>
        <li>
          <strong>Nuevo plan:</strong> elige la plataforma, pon un nombre interno o el que verá el cliente (ej. “Netflix Premium 1 pantalla 30d”),{" "}
          <strong>días de vigencia</strong> y <strong>precio en PEN</strong> (eso es lo que se cobra al pulsar “Suscribirme” en la tienda).
        </li>
        <li>
          <strong>Igual que el mensaje de WhatsApp:</strong> en <strong>Nuevo plan</strong> (bloque opcional desplegable) o después con{" "}
          <strong>Anuncio (WhatsApp)</strong>: misma pantalla — URL o <strong>adjuntar imagen</strong>, titular, acceso, calidad, dispositivos, avisos y
          texto libre.
        </li>
      </ol>
      <figure className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <figcaption className="mb-2 font-bold text-slate-800">Ejemplo de mensaje antiguo (referencia)</figcaption>
        <pre className="whitespace-pre-wrap font-sans">
          {`NETFLIX PREMIUM
Acceso: Correo y contraseña
Calidad: 4K Ultra HD
Dispositivos: 01 en simultáneo

▫️ 30 días  → S/13.00
HASTA AGOTAR STOCK`}
        </pre>
        <p className="mt-2 text-slate-500">
          Titular → “Titular en la tarjeta”; las tres líneas siguientes → Acceso, Calidad, Dispositivos; “HASTA…” → Aviso de stock; la línea con ▫️ →
          Texto adicional (o déjala y el precio oficial sigue siendo el del plan).
        </p>
      </figure>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-4" />}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Nueva plataforma</h2>
          <form className="mt-4 space-y-3" onSubmit={createPlatform}>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nombre (ej. Netflix)"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Slug (ej. netflix)"
              value={pSlug}
              onChange={(e) => setPSlug(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Descripción (opcional)"
              rows={2}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Orden (número, opcional)"
              value={pSort}
              onChange={(e) => setPSort(e.target.value)}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-500"
            >
              Crear plataforma
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Nuevo plan</h2>
          <form className="mt-4 space-y-3" onSubmit={createPlan}>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nombre del plan (ej. Perfil 1 pantalla 30d)"
              value={plName}
              onChange={(e) => setPlName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min={1}
                placeholder="Días"
                value={plDays}
                onChange={(e) => setPlDays(e.target.value)}
              />
              <input
                className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                type="number"
                step="0.01"
                min={0}
                placeholder="Precio (PEN)"
                value={plPrice}
                onChange={(e) => setPlPrice(e.target.value)}
              />
            </div>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Clave de variante (opcional, ej. PROFILE_1)"
              value={plVariant}
              onChange={(e) => setPlVariant(e.target.value)}
            />
            <details className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm text-slate-700">
              <summary className="cursor-pointer font-bold text-slate-800">Opcional: mismo contenido que WhatsApp al crear</summary>
              <p className="mt-2 text-xs text-slate-500">
                Mismos campos que <strong>Anuncio (WhatsApp)</strong>. Si lo omites aquí, edítalo después desde la lista de planes.
              </p>
              <div className="mt-3 space-y-3 pb-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700" htmlFor="new-plan-card-kind">
                    Tipo de tarjeta en la tienda
                  </label>
                  <select
                    id="new-plan-card-kind"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={plCardPresentation}
                    onChange={(e) => setPlCardPresentation(e.target.value === "EVENT" ? "EVENT" : "STANDARD")}
                  >
                    <option value="STANDARD">Catálogo (ficha estándar)</option>
                    <option value="EVENT">Evento (partidos, UFC, boxeo — texto largo)</option>
                  </select>
                </div>
                <PlanPromoImageField
                  inputId="new-plan-promo-image"
                  variant="light"
                  value={plPromoUrl}
                  onChange={setPlPromoUrl}
                  onUploadError={(m) => showSnackbar(m, "error")}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Titular en tarjeta (ej. NETFLIX PREMIUM)"
                  value={plCardTitle}
                  onChange={(e) => setPlCardTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Acceso (ej. Correo y contraseña)"
                  value={plAccess}
                  onChange={(e) => setPlAccess(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Calidad (ej. 4K Ultra HD)"
                  value={plQuality}
                  onChange={(e) => setPlQuality(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Dispositivos (ej. 01 en simultáneo)"
                  value={plDevices}
                  onChange={(e) => setPlDevices(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Aviso stock (ej. HASTA AGOTAR STOCK)"
                  value={plStock}
                  onChange={(e) => setPlStock(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Compatibilidad (opcional, ej. Mac, Windows, Android, iOS)"
                  value={plComp}
                  onChange={(e) => setPlComp(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Aviso importante (opcional)"
                  value={plWarn}
                  onChange={(e) => setPlWarn(e.target.value)}
                />
                <textarea
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  rows={plCardPresentation === "EVENT" ? 8 : 4}
                  placeholder={
                    plCardPresentation === "EVENT"
                      ? "Pega el mensaje completo del evento (emojis, listas MOVISTAR/IPTV, Discord, EN VIVO…)"
                      : "Texto adicional (ej. ▫️ 30 días  → S/13.00)"
                  }
                  value={plExtra}
                  onChange={(e) => setPlExtra(e.target.value)}
                />
              </div>
            </details>
            <button
              type="submit"
              className="w-full rounded-full bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-500"
            >
              Crear plan
            </button>
          </form>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-extrabold text-slate-900">Plataformas existentes</h2>
        <ul className="mt-4 space-y-2">
          {platforms.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span>
                <strong>{p.name}</strong> <span className="text-slate-500">({p.slug})</span> —{" "}
                {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "—"}
              </span>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:border-sky-500"
                onClick={() => void togglePlatformActive(p)}
              >
                {p.active === false ? "Activar" : "Desactivar"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold text-slate-900">Planes existentes</h2>
        <ul className="mt-4 space-y-2">
          {plans.map((pl) => {
            const plat = platforms.find((x) => x.id === pl.platformID);
            return (
              <li
                key={pl.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span>
                    <strong>{plat?.name ?? "?"}</strong> — {pl.name} · {pl.durationDays}d · {formatPlanPrice(pl.pricePen)}
                  </span>
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
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800 hover:border-slate-500"
                    onClick={() => setMarketingPlan(pl)}
                  >
                    Anuncio (WhatsApp)
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:border-sky-500"
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
