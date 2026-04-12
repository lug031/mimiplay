/**
 * Campos de presentación del anuncio en el catálogo. Vacíos = no se muestran en la tarjeta.
 */
export type CardPresentation = "STANDARD" | "EVENT";

export type PlanMarketingFields = {
  /** STANDARD = ficha catálogo; EVENT = tarjeta con texto largo e imagen. */
  cardPresentation?: CardPresentation | string | null;
  promoImageUrl?: string | null;
  /** Titular grande en la tarjeta; si falta se usa el nombre del anuncio. */
  cardTitle?: string | null;
  accessSummary?: string | null;
  qualitySummary?: string | null;
  devicesSummary?: string | null;
  compatibilitySummary?: string | null;
  stockNotice?: string | null;
  warningNotice?: string | null;
  /** Texto libre multilínea: otras vigencias/precios, tiers, add-ons, emojis, etc. */
  extraContent?: string | null;
};

export function planDisplayTitle(row: { planName: string; cardTitle?: string | null }) {
  const t = row.cardTitle?.trim();
  return t || row.planName;
}

export function isEventCardPresentation(p: PlanMarketingFields): boolean {
  return p.cardPresentation === "EVENT";
}

/** True si el anuncio tiene imagen o texto de presentación rellenado. */
export function planRowHasRichMarketing(p: PlanMarketingFields): boolean {
  if (p.promoImageUrl?.trim()) return true;
  if (p.cardTitle?.trim()) return true;
  if (composeServiceDetailsForEditor(p).trim()) return true;
  if (p.stockNotice?.trim()) return true;
  if (p.warningNotice?.trim()) return true;
  if (p.extraContent?.trim()) return true;
  return false;
}

/**
 * Texto de ficha técnica unificado para el editor admin.
 * Nuevo contenido: todo en `accessSummary` (multilínea). Legacy: combina acceso, calidad, dispositivos y compatibilidad.
 */
export function composeServiceDetailsForEditor(p: PlanMarketingFields): string {
  const a = p.accessSummary?.trim() ?? "";
  const q = p.qualitySummary?.trim() ?? "";
  const d = p.devicesSummary?.trim() ?? "";
  const c = p.compatibilitySummary?.trim() ?? "";
  const hasLegacySplit = Boolean(q || d || c);
  if (a && !hasLegacySplit) return a.trim();
  const parts: string[] = [];
  if (a) parts.push(/:/.test(a) ? a : `Acceso: ${a}`);
  if (q) parts.push(/:/.test(q) ? q : `Calidad: ${q}`);
  if (d) parts.push(/:/.test(d) ? d : `Dispositivos: ${d}`);
  if (c) parts.push(/:/.test(c) ? c : `Compatibilidad: ${c}`);
  return parts.join("\n");
}

/** Texto a mostrar en la tarjeta pública (misma lógica que el editor). */
export function planServiceDetailsForCard(p: PlanMarketingFields): string | null {
  const t = composeServiceDetailsForEditor(p).trim();
  return t || null;
}
