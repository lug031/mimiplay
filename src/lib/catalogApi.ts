import { dataClient } from "@/lib/dataClient";

export type PlanRow = {
  planId: string;
  planName: string;
  durationDays: number;
  pricePen: number;
  planVariantKey: string | null | undefined;
  platformId: string;
  platformName: string;
  platformSlug: string;
  category: string | null | undefined;
};

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
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      pricePen: plan.pricePen,
      planVariantKey: plan.planVariantKey,
      platformId: plat.id!,
      platformName: plat.name,
      platformSlug: plat.slug,
      category: plat.category,
    });
  }
  rows.sort((a, b) => {
    const so = (plat: PlanRow) => `${plat.platformName} ${plat.planName}`;
    return so(a).localeCompare(so(b), "es");
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
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      pricePen: plan.pricePen,
      planVariantKey: plan.planVariantKey,
      platformId: plat.id!,
      platformName: plat.name,
      platformSlug: plat.slug,
      category: plat.category,
    });
  }
  rows.sort((a, b) => `${a.platformName} ${a.planName}`.localeCompare(`${b.platformName} ${b.planName}`, "es"));
  return rows;
}
