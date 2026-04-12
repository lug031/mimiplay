/**
 * Único flujo de pago en tienda (Yape | Plin). Valores por defecto; sobreescribe con env si hace falta.
 */
const numRaw = String(import.meta.env.VITE_MIMIPLAY_YAPE_PLIN_NUMBER ?? "935189609").replace(/\D/g, "");
const holder = String(import.meta.env.VITE_MIMIPLAY_PAYMENT_HOLDER ?? "Jimmy Arias").trim() || "Jimmy Arias";

/** Número para mostrar (espacios tipo 935 189 609 si son 9 dígitos). */
export function formatYapePlinDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return digits || "935 189 609";
}

export const MIMIPLAY_PAYMENT = {
  /** Valor guardado en `CustomerOrder.paymentMethod`. */
  methodCode: "YAPE_PLIN" as const,
  yapePlinDigits: numRaw || "935189609",
  get yapePlinDisplay() {
    return formatYapePlinDisplay(this.yapePlinDigits);
  },
  accountHolder: holder,
} as const;
