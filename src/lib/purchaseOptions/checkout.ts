import { formatPlanPrice } from "@/lib/formatPlanPrice";
import type { CheckoutTierChoice, PurchaseTier, PurchaseTierCatalog } from "./types";

/**
 * Lista lineal para radios, query `opcion`, checkout y precio del CTA.
 * Sin tiers configurados → una sola opción sintética `_base` desde el plan.
 */
export function checkoutTierChoices(
  catalog: PurchaseTierCatalog,
  base: { durationDays: number; pricePen: number },
): CheckoutTierChoice[] {
  const out: CheckoutTierChoice[] = [];
  for (const g of catalog.groups) {
    for (const t of g.tiers) {
      out.push({
        ...t,
        groupId: g.id,
        groupTitle: g.title,
        groupEmoji: g.emoji,
      });
    }
  }
  if (out.length === 0) {
    return [
      {
        id: "_base",
        label: `${base.durationDays} días`,
        durationDays: base.durationDays,
        pricePen: base.pricePen,
        groupId: "_base",
        groupTitle: "",
      },
    ];
  }
  return out;
}

export function findCheckoutTierChoice(
  choices: CheckoutTierChoice[],
  optionId: string | null | undefined,
): CheckoutTierChoice | null {
  if (!optionId?.trim()) return null;
  return choices.find((c) => c.id === optionId) ?? null;
}

/** Texto corto en la fila de la tarjeta (badge de vigencia). */
export function catalogTierRowCaption(tier: PurchaseTier): string {
  const t = tier.label.trim();
  return t || `${tier.durationDays} días`;
}

/** Valor persistido en `CustomerOrder.chosenOptionLabel`. */
export function formatChosenTierLabel(choice: CheckoutTierChoice): string {
  const lab = choice.label.trim() || `${choice.durationDays} días`;
  const gt = choice.groupTitle.trim();
  if (gt) return `${gt} · ${lab}`;
  return lab;
}

/** True si el texto del tier no aporta nada más que la vigencia (ya mostrada aparte). */
function tierLabelIsOnlyDuration(label: string, durationDays: number): boolean {
  const s = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const d = durationDays;
  if (s === `${d}`) return true;
  if (s === `${d}d` || s === `${d} d`) return true;
  if (s === `${d} dia` || s === `${d} dias`) return true;
  if (s === `${d}-dia` || s === `${d}-dias`) return true;
  return false;
}

/**
 * Línea secundaria en checkout cuando arriba ya van precio + `durationDays` días.
 * Evita repetir "90 días" si el label del tier es solo la vigencia.
 */
export function formatChosenTierDetailLine(choice: CheckoutTierChoice): string | null {
  if (choice.id === "_base") return null;
  const lab = choice.label.trim() || `${choice.durationDays} días`;
  const gt = choice.groupTitle.trim();

  if (tierLabelIsOnlyDuration(lab, choice.durationDays)) {
    return gt || null;
  }
  return formatChosenTierLabel(choice);
}

/**
 * Una sola línea para pedidos (`chosenOptionLabel` + días + precio) sin repetir la vigencia
 * cuando el label guardado ya termina en "90 dias" / "30 días", etc.
 */
export function orderChosenOptionSummaryLine(
  chosenOptionLabel: string,
  chosenDurationDays: number | null | undefined,
  chosenPricePen: number | null | undefined,
): string {
  const price = formatPlanPrice(chosenPricePen ?? 0);
  const label = chosenOptionLabel.trim();
  const days = chosenDurationDays;

  if (!label) {
    return days != null && Number.isFinite(days) ? `${days} días · ${price}` : price;
  }
  if (days == null || !Number.isFinite(days)) {
    return `${label} · ${price}`;
  }

  const parts = label
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return `${days} días · ${price}`;
  }
  const last = parts[parts.length - 1]!;
  if (tierLabelIsOnlyDuration(last, days)) {
    const head = parts.slice(0, -1).join(" · ");
    return head ? `${head} · ${days} días · ${price}` : `${days} días · ${price}`;
  }
  return `${label} · ${days} días · ${price}`;
}

/** Agrupa la lista lineal de checkout por `groupId` preservando orden de aparición. */
export type CheckoutChoiceGroup = {
  groupId: string;
  groupTitle: string;
  groupEmoji?: string;
  choices: CheckoutTierChoice[];
};

export function checkoutChoicesGrouped(flat: CheckoutTierChoice[]): CheckoutChoiceGroup[] {
  const map = new Map<string, CheckoutTierChoice[]>();
  const order: string[] = [];
  for (const c of flat) {
    if (!map.has(c.groupId)) {
      order.push(c.groupId);
      map.set(c.groupId, []);
    }
    map.get(c.groupId)!.push(c);
  }
  return order.map((gid) => {
    const opts = map.get(gid)!;
    const h = opts[0]!;
    return {
      groupId: gid,
      groupTitle: h.groupTitle,
      groupEmoji: h.groupEmoji,
      choices: opts,
    };
  });
}
