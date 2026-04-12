/**
 * Opciones de compra por anuncio (`purchaseOptionsJson`).
 *
 * - **Persistencia:** documento JSON versión 2 (`stringifyPurchaseTierCatalog` / `parsePurchaseTierCatalog`).
 * - **UI tienda:** `PlanRow.purchaseTierCatalog` + `checkoutTierChoices`.
 * - **Admin:** borradores `AdminTierGroupDraft` ↔ catálogo (`purchaseTierCatalogFromAdminDrafts`).
 */

export type {
  CheckoutTierChoice,
  PurchaseOptionsDocumentV2,
  PurchaseTier,
  PurchaseTierCatalog,
  PurchaseTierGroup,
} from "./types";
export { PURCHASE_OPTIONS_SCHEMA_VERSION } from "./types";

export {
  firstTierInCatalog,
  parsePurchaseTierCatalog,
  stringifyPurchaseTierCatalog,
  totalTierCount,
} from "./parseCatalog";

export {
  catalogTierRowCaption,
  checkoutChoicesGrouped,
  checkoutTierChoices,
  findCheckoutTierChoice,
  formatChosenTierLabel,
  type CheckoutChoiceGroup,
} from "./checkout";

export {
  adminDraftsFromPurchaseCatalog,
  emptyAdminTierGroup,
  emptyAdminTierRow,
  purchaseTierCatalogFromAdminDrafts,
  type AdminTierGroupDraft,
  type AdminTierRowDraft,
} from "./adminDraft";

export { slugifyGroupId, slugifyTierId } from "./slugify";

/** Compat: mismo nombre que antes para imports externos que aún digan slugifyOptionId */
export { slugifyTierId as slugifyOptionId } from "./slugify";
