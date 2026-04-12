import { dataClient } from "@/lib/dataClient";
import type { PlanMarketingFields } from "@/lib/planMarketing";
import { parsePurchaseTierCatalog, type PurchaseTierCatalog } from "@/lib/purchaseOptions";

/** Una fila del catálogo = un anuncio publicado (API: ServicePlan). */
export type PlanRow = PlanMarketingFields & {
  /** ID del anuncio. */
  planId: string;
  /** Nombre del anuncio (referencia interna / listado). */
  planName: string;
  durationDays: number;
  pricePen: number;
  planVariantKey: string | null | undefined;
  platformId: string;
  platformName: string;
  platformSlug: string;
  category: string | null | undefined;
  /** Catálogo de precios (grupos + tiers). Vacío = usar solo `durationDays`/`pricePen` del registro. */
  purchaseTierCatalog: PurchaseTierCatalog;
};

function marketingFromPlan(plan: {
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
  purchaseOptionsJson?: string | null;
}): PlanMarketingFields {
  return {
    cardPresentation: plan.cardPresentation,
    promoImageUrl: plan.promoImageUrl,
    cardTitle: plan.cardTitle,
    accessSummary: plan.accessSummary,
    qualitySummary: plan.qualitySummary,
    devicesSummary: plan.devicesSummary,
    compatibilitySummary: plan.compatibilitySummary,
    stockNotice: plan.stockNotice,
    warningNotice: plan.warningNotice,
    extraContent: plan.extraContent,
  };
}

/** Catálogo público (API Key) para landing y página /catalogo. */
export async function listCatalogPlans(): Promise<PlanRow[]> {
  const [plansRes, platformsRes] = await Promise.all([
    dataClient.models.ServicePlan.list({ authMode: "apiKey" }),
    dataClient.models.Platform.list({ authMode: "apiKey" }),
  ]);

  const platforms = new Map(
    (platformsRes.data ?? [])
      .filter((p) => p.id && p.active !== false)
      .map((p) => [p.id, p]),
  );

  const rows: PlanRow[] = [];
  for (const plan of plansRes.data ?? []) {
    if (!plan.id || plan.active === false) continue;
    const plat = platforms.get(plan.platformID);
    if (!plat) continue;
    rows.push({
      ...marketingFromPlan(plan),
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      pricePen: plan.pricePen,
      planVariantKey: plan.planVariantKey,
      platformId: plat.id!,
      platformName: plat.name,
      platformSlug: plat.slug,
      category: plat.category,
      purchaseTierCatalog: parsePurchaseTierCatalog(plan.purchaseOptionsJson),
    });
  }
  rows.sort((a, b) => {
    const ev = (r: PlanRow) => (r.cardPresentation === "EVENT" ? 0 : 1);
    const byEvent = ev(a) - ev(b);
    if (byEvent !== 0) return byEvent;
    return `${a.platformName} ${a.planName}`.localeCompare(`${b.platformName} ${b.planName}`);
  });
  return rows;
}

/** Mismo catálogo con sesión de usuario (User Pool). */
export async function listCatalogPlansAuthed(): Promise<PlanRow[]> {
  const [plansRes, platformsRes] = await Promise.all([
    dataClient.models.ServicePlan.list(),
    dataClient.models.Platform.list(),
  ]);
  const platforms = new Map(
    (platformsRes.data ?? [])
      .filter((p) => p.id && p.active !== false)
      .map((p) => [p.id, p]),
  );
  const rows: PlanRow[] = [];
  for (const plan of plansRes.data ?? []) {
    if (!plan.id || plan.active === false) continue;
    const plat = platforms.get(plan.platformID);
    if (!plat) continue;
    rows.push({
      ...marketingFromPlan(plan),
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      pricePen: plan.pricePen,
      planVariantKey: plan.planVariantKey,
      platformId: plat.id!,
      platformName: plat.name,
      platformSlug: plat.slug,
      category: plat.category,
      purchaseTierCatalog: parsePurchaseTierCatalog(plan.purchaseOptionsJson),
    });
  }
  rows.sort((a, b) => {
    const ev = (r: PlanRow) => (r.cardPresentation === "EVENT" ? 0 : 1);
    const byEvent = ev(a) - ev(b);
    if (byEvent !== 0) return byEvent;
    return `${a.platformName} ${a.planName}`.localeCompare(`${b.platformName} ${b.planName}`);
  });
  return rows;
}
