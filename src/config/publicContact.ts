/**
 * URLs públicas de redes (opcional). Si quedan vacías, los iconos enlazan a `#contacto` en la landing.
 * Ejemplo WhatsApp: https://wa.me/51999999999
 */
export const PUBLIC_SOCIAL_URLS = {
  facebook: String(import.meta.env.VITE_MIMIPLAY_FACEBOOK_URL ?? "").trim(),
  whatsapp: String(import.meta.env.VITE_MIMIPLAY_WHATSAPP_URL ?? "").trim(),
  telegram: String(import.meta.env.VITE_MIMIPLAY_TELEGRAM_URL ?? "").trim(),
} as const;

export function socialHref(url: string): string {
  return url || "#contacto";
}
