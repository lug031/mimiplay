/**
 * Opciones elegibles por el cliente dentro de un mismo anuncio (ej. perfil 30d vs cuenta 90d).
 * Se persisten en ServicePlan.purchaseOptionsJson como JSON.
 */
export type PurchaseOption = {
  id: string;
  label: string;
  durationDays: number;
  pricePen: number;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parsePurchaseOptionsJson(raw: string | null | undefined): PurchaseOption[] | null {
  if (!raw?.trim()) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data) || data.length === 0) return null;
    const out: PurchaseOption[] = [];
    for (const item of data) {
      if (!isRecord(item)) continue;
      const id = String(item.id ?? "").trim();
      const label = String(item.label ?? "").trim();
      const durationDays = Number(item.durationDays);
      const pricePen = Number(item.pricePen);
      if (!id || !label || !Number.isFinite(durationDays) || durationDays < 1 || !Number.isFinite(pricePen) || pricePen < 0) continue;
      out.push({ id, label, durationDays, pricePen });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function stringifyPurchaseOptions(options: PurchaseOption[]): string {
  return JSON.stringify(
    options.map((o) => ({
      id: o.id.trim(),
      label: o.label.trim(),
      durationDays: Math.round(o.durationDays),
      pricePen: Math.round(o.pricePen * 100) / 100,
    })),
  );
}

/** Lista efectiva para UI y checkout: JSON válido o una sola opción desde el plan base. */
export function purchaseChoicesForPlan(row: {
  purchaseOptions?: PurchaseOption[] | null;
  durationDays: number;
  pricePen: number;
}): PurchaseOption[] {
  const parsed = row.purchaseOptions;
  if (parsed && parsed.length > 0) return parsed;
  return [
    {
      id: "_base",
      label: `${row.durationDays} días`,
      durationDays: row.durationDays,
      pricePen: row.pricePen,
    },
  ];
}

export function findPurchaseOption(
  choices: PurchaseOption[],
  optionId: string | null | undefined,
): PurchaseOption | null {
  if (!optionId?.trim()) return null;
  return choices.find((o) => o.id === optionId) ?? null;
}

export type AdminPurchaseOptionRow = { id: string; label: string; days: string; price: string };

/** Convierte filas del formulario admin en opciones válidas o null si ninguna fila es usable. */
export function purchaseOptionsFromAdminRows(rows: AdminPurchaseOptionRow[]): PurchaseOption[] | null {
  const out: PurchaseOption[] = [];
  rows.forEach((row, i) => {
    const label = row.label.trim();
    const durationDays = Number.parseInt(row.days, 10);
    const pricePen = Number.parseFloat(row.price);
    if (!label || !Number.isFinite(durationDays) || durationDays < 1 || !Number.isFinite(pricePen) || pricePen < 0) return;
    const id = row.id.trim() || slugifyOptionId(label, i);
    out.push({ id, label, durationDays, pricePen });
  });
  return out.length > 0 ? out : null;
}

export function adminRowsFromPurchaseOptions(options: PurchaseOption[] | null | undefined): AdminPurchaseOptionRow[] {
  if (!options?.length) return [];
  return options.map((o) => ({
    id: o.id,
    label: o.label,
    days: String(o.durationDays),
    price: String(o.pricePen),
  }));
}

export function slugifyOptionId(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || `opcion-${index + 1}`;
}
