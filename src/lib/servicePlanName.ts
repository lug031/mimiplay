/** Longitud razonable para `ServicePlan.name` en AppSync / DynamoDB. */
const MAX_LEN = 200;

function clamp(s: string): string {
  const t = s.trim();
  return t.length <= MAX_LEN ? t : t.slice(0, MAX_LEN);
}

/**
 * Valor persistido en `ServicePlan.name`: obligatorio en el modelo, pero no hay campo dedicado en el admin.
 * Prioridad: titular de tarjeta → clave de variante → plataforma + sufijo único.
 */
export function deriveServicePlanStorageName(params: {
  cardTitle: string;
  planVariantKey: string;
  platformName: string;
}): string {
  const fromTitle = params.cardTitle.trim();
  if (fromTitle.length > 0) return clamp(fromTitle);
  const fromVariant = params.planVariantKey.trim();
  if (fromVariant.length > 0) return clamp(fromVariant);
  const plat = params.platformName.trim() || "Anuncio";
  const raw = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const suffix = raw.replace(/-/g, "").slice(0, 10);
  return clamp(`${plat} · ${suffix}`);
}
