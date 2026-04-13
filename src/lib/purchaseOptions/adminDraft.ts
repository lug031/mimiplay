import type { PurchaseTier, PurchaseTierCatalog, PurchaseTierGroup } from "./types";
import { stableGroupId, stableTierId } from "./slugify";

function newDraftId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Una fila en el editor admin. `id` es opaco: se asigna al crear la fila o viene del catálogo guardado;
 * no se edita a mano (estabilidad en URLs/checkout).
 */
export type AdminTierRowDraft = {
  id: string;
  label: string;
  days: string;
  price: string;
};

/** Un bloque / tipo en el editor admin (título del bloque opcional; solo icono también es válido). */
export type AdminTierGroupDraft = {
  id: string;
  title: string;
  emoji: string;
  rows: AdminTierRowDraft[];
};

export function emptyAdminTierRow(): AdminTierRowDraft {
  return { id: newDraftId(), label: "", days: "", price: "" };
}

export function emptyAdminTierGroup(): AdminTierGroupDraft {
  return { id: newDraftId(), title: "", emoji: "", rows: [emptyAdminTierRow()] };
}

export function adminDraftsFromPurchaseCatalog(catalog: PurchaseTierCatalog): AdminTierGroupDraft[] {
  if (catalog.groups.length === 0) return [];
  return catalog.groups.map((g) => ({
    id: g.id || newDraftId(),
    title: g.title,
    emoji: g.emoji ?? "",
    rows:
      g.tiers.length > 0
        ? g.tiers.map((t) => ({
            id: t.id || newDraftId(),
            label: t.label,
            days: String(t.durationDays),
            price: String(t.pricePen),
          }))
        : [emptyAdminTierRow()],
  }));
}

/**
 * Construye catálogo persistible. Omite grupos sin filas válidas.
 * `null` si no hay ningún tier válido.
 */
export function purchaseTierCatalogFromAdminDrafts(drafts: AdminTierGroupDraft[]): PurchaseTierCatalog | null {
  const groups: PurchaseTierGroup[] = [];
  drafts.forEach((d, gi) => {
    const tiers: PurchaseTier[] = [];
    d.rows.forEach((row, ri) => {
      const label = row.label.trim();
      const durationDays = Number.parseInt(row.days, 10);
      const pricePen = Number.parseFloat(row.price);
      if (!label || !Number.isFinite(durationDays) || durationDays < 1 || !Number.isFinite(pricePen) || pricePen < 0) return;
      const persistedTierId = row.id.trim();
      tiers.push({
        id: persistedTierId || stableTierId(gi, ri, label),
        label,
        durationDays,
        pricePen: Math.round(pricePen * 100) / 100,
      });
    });
    if (tiers.length === 0) return;
    const title = d.title.trim();
    const persistedGroupId = d.id.trim();
    const groupId = persistedGroupId || stableGroupId(gi, title || `grupo-${gi + 1}`);
    const emoji = d.emoji.trim() || undefined;
    groups.push({ id: groupId, title, emoji, tiers });
  });
  return groups.length > 0 ? { groups } : null;
}
