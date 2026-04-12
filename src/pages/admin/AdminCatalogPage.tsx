import { type FormEvent, useEffect, useState } from "react";
import { dataClient } from "@/lib/dataClient";
import { CATEGORY_LABEL } from "@/lib/orderStatus";

type Platform = {
  id: string;
  name: string;
  slug: string;
  category: string | null | undefined;
  active: boolean | null | undefined;
};

type ServicePlan = {
  id: string;
  platformID: string;
  name: string;
  durationDays: number;
  pricePen: number;
  planVariantKey: string | null | undefined;
  active: boolean | null | undefined;
};

const CATEGORIES = ["STREAMING", "SPORTS", "PC_APP", "OTHER"] as const;

export function AdminCatalogPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pr, sr] = await Promise.all([
        dataClient.models.Platform.list(),
        dataClient.models.ServicePlan.list(),
      ]);
      const plats = (pr.data ?? []).filter((x) => x.id).map((x) => x as Platform);
      setPlatforms(plats);
      setPlans((sr.data ?? []).filter((x) => x.id).map((x) => x as ServicePlan));
      setSelectedPlatformId((prev) => prev || plats[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  async function createPlatform(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!pName.trim() || !pSlug.trim()) {
      setMsg("Nombre y slug son obligatorios.");
      return;
    }
    const { errors } = await dataClient.models.Platform.create({
      name: pName.trim(),
      slug: pSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: pDesc.trim() || undefined,
      category: pCategory,
      active: true,
      sortOrder: pSort ? Number.parseInt(pSort, 10) : undefined,
    });
    if (errors?.length) {
      setMsg(errors.map((x) => x.message).join("; "));
      return;
    }
    setPName("");
    setPSlug("");
    setPDesc("");
    setPSort("");
    setMsg("Plataforma creada.");
    await load();
  }

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!selectedPlatformId) {
      setMsg("Selecciona una plataforma.");
      return;
    }
    if (!plName.trim() || !plPrice) {
      setMsg("Nombre y precio son obligatorios.");
      return;
    }
    const { errors } = await dataClient.models.ServicePlan.create({
      platformID: selectedPlatformId,
      name: plName.trim(),
      durationDays: Number.parseInt(plDays, 10) || 30,
      pricePen: Number.parseFloat(plPrice),
      planVariantKey: plVariant.trim() || undefined,
      active: true,
    });
    if (errors?.length) {
      setMsg(errors.map((x) => x.message).join("; "));
      return;
    }
    setPlName("");
    setPlPrice("");
    setPlVariant("");
    setMsg("Plan creado.");
    await load();
  }

  async function togglePlatformActive(p: Platform) {
    await dataClient.models.Platform.update({
      id: p.id,
      active: !(p.active !== false),
    });
    await load();
  }

  async function togglePlanActive(pl: ServicePlan) {
    await dataClient.models.ServicePlan.update({
      id: pl.id,
      active: !(pl.active !== false),
    });
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Catálogo</h1>
      <p className="mt-2 text-sm text-tcr-text-muted">Plataformas y planes que ven los clientes en la web.</p>

      {loading && <p className="mt-4 text-tcr-text-muted">Cargando…</p>}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}
      {msg && (
        <div className="mt-4 rounded-lg border border-tcr-border bg-white px-3 py-2 text-sm text-tcr-dark">{msg}</div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-2xl border border-tcr-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Nueva plataforma</h2>
          <form className="mt-4 space-y-3" onSubmit={createPlatform}>
            <input
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
              placeholder="Nombre (ej. Netflix)"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
              placeholder="Slug (ej. netflix)"
              value={pSlug}
              onChange={(e) => setPSlug(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
              placeholder="Descripción (opcional)"
              rows={2}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
              placeholder="Orden (número, opcional)"
              value={pSort}
              onChange={(e) => setPSort(e.target.value)}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-tcr-teal py-2.5 text-sm font-bold text-white hover:bg-[#007a8f]"
            >
              Crear plataforma
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-tcr-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Nuevo plan</h2>
          <form className="mt-4 space-y-3" onSubmit={createPlan}>
            <select
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
              placeholder="Nombre del plan (ej. Perfil 1 pantalla 30d)"
              value={plName}
              onChange={(e) => setPlName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="w-1/2 rounded-lg border border-tcr-border px-3 py-2 text-sm"
                type="number"
                min={1}
                placeholder="Días"
                value={plDays}
                onChange={(e) => setPlDays(e.target.value)}
              />
              <input
                className="w-1/2 rounded-lg border border-tcr-border px-3 py-2 text-sm"
                type="number"
                step="0.01"
                min={0}
                placeholder="Precio PEN"
                value={plPrice}
                onChange={(e) => setPlPrice(e.target.value)}
              />
            </div>
            <input
              className="w-full rounded-lg border border-tcr-border px-3 py-2 text-sm"
              placeholder="Clave de variante (opcional, ej. PROFILE_1)"
              value={plVariant}
              onChange={(e) => setPlVariant(e.target.value)}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-tcr-teal py-2.5 text-sm font-bold text-white hover:bg-[#007a8f]"
            >
              Crear plan
            </button>
          </form>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-extrabold">Plataformas existentes</h2>
        <ul className="mt-4 space-y-2">
          {platforms.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-tcr-border bg-white px-3 py-2 text-sm"
            >
              <span>
                <strong>{p.name}</strong> <span className="text-tcr-text-muted">({p.slug})</span> —{" "}
                {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "—"}
              </span>
              <button
                type="button"
                className="rounded-full border border-tcr-border px-3 py-1 text-xs font-bold hover:border-tcr-teal"
                onClick={() => void togglePlatformActive(p)}
              >
                {p.active === false ? "Activar" : "Desactivar"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Planes existentes</h2>
        <ul className="mt-4 space-y-2">
          {plans.map((pl) => {
            const plat = platforms.find((x) => x.id === pl.platformID);
            return (
              <li
                key={pl.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-tcr-border bg-white px-3 py-2 text-sm"
              >
                <span>
                  <strong>{plat?.name ?? "?"}</strong> — {pl.name} · {pl.durationDays}d · S/{pl.pricePen.toFixed(2)}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-tcr-border px-3 py-1 text-xs font-bold hover:border-tcr-teal"
                  onClick={() => void togglePlanActive(pl)}
                >
                  {pl.active === false ? "Activar" : "Desactivar"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
