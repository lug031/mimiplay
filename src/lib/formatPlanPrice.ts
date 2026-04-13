/** Precio de catálogo (campo `pricePen` en datos); se muestra en soles peruanos. */
export function formatPlanPrice(amount: number): string {
  return `${amount.toFixed(2)} S/.`;
}
