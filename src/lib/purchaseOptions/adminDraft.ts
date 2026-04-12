import type { PurchaseTier, PurchaseTierCatalog, PurchaseTierGroup } from "./types";
import { slugifyGroupId, slugifyTierId } from "./slugify";

/** Una fila en el editor admin (texto hasta validar). */
export type AdminTierRowDraft = {
  id: string;
  label: string;
  days: string;
  price: string;
};

/** Un bloque / tipo en el editor admin. */
export type AdminTierGroupDraft = {
  id: string;
  title: string;
  emoji: string;
  rows: AdminTierRowDraft[];
};

export function emptyAdminTierRow(): AdminTierRowDraft {
  return { id: "", label: "", days: "", price: "" };
}

export function emptyAdminTierGroup(): AdminTierGroupDraft {
  return { id: "", title: "", emoji: "", rows: [emptyAdminTierRow()] };
}

export function adminDraftsFromPurchaseCatalog(catalog: PurchaseTierCatalog): AdminTierGroupDraft[] {
  if (catalog.groups.length === 0) return [];
  return catalog.groups.map((g) => ({
    id: g.id,
    title: g.title,
    emoji: g.emoji ?? "",
    rows:
      g.tiers.length > 0
        ? g.tiers.map((t) => ({
            id: t.id,
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
      const id = row.id.trim() || slugifyTierId(label, gi * 100 + ri);
      tiers.push({
        id,
        label,
        durationDays,
        pricePen: Math.round(pricePen * 100) / 100,
      });
    });
    if (tiers.length === 0) return;
    const title = d.title.trim();
    const groupId = d.id.trim() || slugifyGroupId(title || `grupo-${gi + 1}`, gi);
    const emoji = d.emoji.trim() || undefined;
    groups.push({ id: groupId, title, emoji, tiers });
  });
  return groups.length > 0 ? { groups } : null;
}
