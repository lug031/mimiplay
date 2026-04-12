import { PURCHASE_OPTIONS_SCHEMA_VERSION, type PurchaseTier, type PurchaseTierCatalog, type PurchaseTierGroup } from "./types";
import { slugifyGroupId, slugifyTierId } from "./slugify";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseTier(item: unknown, fallbackIndex: number): PurchaseTier | null {
  if (!isRecord(item)) return null;
  const id = String(item.id ?? "").trim();
  const label = String(item.label ?? "").trim();
  const durationDays = Number(item.durationDays);
  const pricePen = Number(item.pricePen);
  if (!label || !Number.isFinite(durationDays) || durationDays < 1 || !Number.isFinite(pricePen) || pricePen < 0) return null;
  return {
    id: id || slugifyTierId(label, fallbackIndex),
    label,
    durationDays: Math.round(durationDays),
    pricePen: Math.round(pricePen * 100) / 100,
  };
}

function parseTierGroup(obj: unknown, groupIndex: number): PurchaseTierGroup | null {
  if (!isRecord(obj)) return null;
  const rawTiers = obj.tiers ?? obj.options;
  if (!Array.isArray(rawTiers) || rawTiers.length === 0) return null;
  const title = String(obj.title ?? "").trim();
  const emoji = String(obj.emoji ?? "").trim() || undefined;
  const idRaw = String(obj.id ?? "").trim();
  const id = idRaw || slugifyGroupId(title || `grupo-${groupIndex + 1}`, groupIndex);
  const tiers: PurchaseTier[] = [];
  rawTiers.forEach((item, i) => {
    const t = parseTier(item, groupIndex * 100 + i);
    if (t) tiers.push(t);
  });
  if (tiers.length === 0) return null;
  return { id, title, emoji, tiers };
}

/** Documento v2 `{ version: 2, groups: [...] }`. */
function parseDocumentV2(data: Record<string, unknown>): PurchaseTierCatalog | null {
  if (data.version !== PURCHASE_OPTIONS_SCHEMA_VERSION) return null;
  const rawGroups = data.groups;
  if (!Array.isArray(rawGroups) || rawGroups.length === 0) return null;
  const groups: PurchaseTierGroup[] = [];
  rawGroups.forEach((g, i) => {
    const parsed = parseTierGroup(g, i);
    if (parsed) groups.push(parsed);
  });
  return groups.length > 0 ? { groups } : null;
}

/** Fila antigua: array plano en JSON. */
type LegacyFlatRow = PurchaseTier & {
  groupLabel?: string;
  groupEmoji?: string;
};

function parseLegacyFlatRow(item: unknown, index: number): LegacyFlatRow | null {
  if (!isRecord(item)) return null;
  const tier = parseTier(item, index);
  if (!tier) return null;
  const groupLabel = String(item.groupLabel ?? "").trim() || undefined;
  const groupEmoji = String(item.groupEmoji ?? "").trim() || undefined;
  return { ...tier, groupLabel, groupEmoji };
}

/** Array plano sin `groupLabel` → un solo grupo anónimo. */
function catalogFromFlatTiers(tiers: PurchaseTier[]): PurchaseTierCatalog {
  return {
    groups: [
      {
        id: "_default",
        title: "",
        tiers,
      },
    ],
  };
}

/**
 * Filas con `groupLabel` repetido en filas consecutivas (formato admin intermedio)
 * se convierten en grupos explícitos al leer.
 */
function catalogFromLabeledFlatRows(rows: LegacyFlatRow[]): PurchaseTierCatalog {
  const hasGroup = rows.some((r) => (r.groupLabel ?? "").trim().length > 0);
  if (!hasGroup) {
    return catalogFromFlatTiers(rows.map(({ groupLabel: _g, groupEmoji: _e, ...t }) => t));
  }
  const groups: PurchaseTierGroup[] = [];
  for (const row of rows) {
    const gl = (row.groupLabel ?? "").trim();
    const { groupLabel: _gl, groupEmoji: _ge, ...tier } = row;
    const prev = groups[groups.length - 1];
    if (!prev || prev.title !== gl) {
      groups.push({
        id: slugifyGroupId(gl || "default", groups.length),
        title: gl,
        emoji: row.groupEmoji?.trim() || undefined,
        tiers: [tier],
      });
    } else {
      prev.tiers.push(tier);
      if (!prev.emoji && row.groupEmoji?.trim()) prev.emoji = row.groupEmoji.trim();
    }
  }
  return { groups };
}

function parseLegacyJsonArray(data: unknown[]): PurchaseTierCatalog | null {
  if (data.length === 0) return null;
  const rows: LegacyFlatRow[] = [];
  data.forEach((item, i) => {
    const r = parseLegacyFlatRow(item, i);
    if (r) rows.push(r);
  });
  if (rows.length === 0) return null;
  return catalogFromLabeledFlatRows(rows);
}

/** Array de objetos-grupo sin envoltorio `{ version: 2 }` (exportaciones manuales). */
function parseArrayOfGroupObjects(data: unknown[]): PurchaseTierCatalog | null {
  if (data.length === 0) return null;
  const first = data[0];
  if (!isRecord(first) || !Array.isArray(first.tiers ?? first.options)) return null;
  const groups: PurchaseTierGroup[] = [];
  data.forEach((g, i) => {
    const p = parseTierGroup(g, i);
    if (p) groups.push(p);
  });
  return groups.length > 0 ? { groups } : null;
}

/**
 * Lee `purchaseOptionsJson` y devuelve catálogo normalizado.
 * Acepta: v2 document, array plano (legacy), o JSON inválido → `{ groups: [] }`.
 */
export function parsePurchaseTierCatalog(raw: string | null | undefined): PurchaseTierCatalog {
  if (!raw?.trim()) return { groups: [] };
  try {
    const data = JSON.parse(raw) as unknown;
    if (isRecord(data)) {
      const v2 = parseDocumentV2(data);
      if (v2) return v2;
    }
    if (Array.isArray(data)) {
      const asGroups = parseArrayOfGroupObjects(data);
      if (asGroups) return asGroups;
      const legacy = parseLegacyJsonArray(data);
      if (legacy) return legacy;
    }
  } catch {
    /* vacío abajo */
  }
  return { groups: [] };
}

/** Serializa catálogo válido para persistir (solo grupos con al menos un tier). */
export function stringifyPurchaseTierCatalog(catalog: PurchaseTierCatalog): string {
  const groups = catalog.groups
    .map((g) => {
      const tiers = g.tiers.map((t) => ({
        id: t.id.trim(),
        label: t.label.trim(),
        durationDays: Math.round(t.durationDays),
        pricePen: Math.round(t.pricePen * 100) / 100,
      }));
      const title = g.title.trim();
      const row: Record<string, unknown> = {
        id: g.id.trim(),
        title,
        tiers,
      };
      const em = g.emoji?.trim();
      if (em) row.emoji = em;
      return row;
    })
    .filter((g) => (g.tiers as PurchaseTier[]).length > 0);

  const doc = {
    version: PURCHASE_OPTIONS_SCHEMA_VERSION,
    groups,
  };
  return JSON.stringify(doc);
}

/** Primer tier del catálogo (orden grupos + tiers) para alinear `durationDays`/`pricePen` base al crear. */
export function firstTierInCatalog(catalog: PurchaseTierCatalog | null): PurchaseTier | null {
  if (!catalog) return null;
  for (const g of catalog.groups) {
    if (g.tiers[0]) return g.tiers[0]!;
  }
  return null;
}

/** Número total de tiers configurados (para badges en admin). */
export function totalTierCount(catalog: PurchaseTierCatalog): number {
  return catalog.groups.reduce((n, g) => n + g.tiers.length, 0);
}
