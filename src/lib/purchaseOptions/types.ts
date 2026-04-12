/**
 * Esquema de precios por anuncio (`ServicePlan.purchaseOptionsJson`).
 * Versión 2: grupos explícitos (tipo de producto) con tiers (vigencia + precio).
 */

export const PURCHASE_OPTIONS_SCHEMA_VERSION = 2 as const;

/** Una línea elegible en checkout (vigencia + precio). Los `id` son únicos en todo el anuncio. */
export type PurchaseTier = {
  id: string;
  label: string;
  durationDays: number;
  pricePen: number;
};

/** Bloque de UI / negocio: ej. «PERFIL - 1 PANTALLA», «CUENTA COMPLETA». */
export type PurchaseTierGroup = {
  id: string;
  title: string;
  emoji?: string;
  tiers: PurchaseTier[];
};

/** Lo que se persiste en JSON (siempre se escribe en este formato desde admin). */
export type PurchaseOptionsDocumentV2 = {
  version: typeof PURCHASE_OPTIONS_SCHEMA_VERSION;
  groups: PurchaseTierGroup[];
};

/** Vista normalizada en memoria tras `parsePurchaseTierCatalog`. */
export type PurchaseTierCatalog = {
  groups: PurchaseTierGroup[];
};

/** Tier con contexto de grupo para checkout, URLs y etiquetas de pedido. */
export type CheckoutTierChoice = PurchaseTier & {
  groupId: string;
  groupTitle: string;
  groupEmoji?: string;
};
