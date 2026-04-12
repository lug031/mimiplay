/** Precio de catálogo (campo `pricePen` en datos); se muestra con código ISO para uso neutro. */
export function formatPlanPrice(amount: number): string {
  return `${amount.toFixed(2)} PEN`;
}
