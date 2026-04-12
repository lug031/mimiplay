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
