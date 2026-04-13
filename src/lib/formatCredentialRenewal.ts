/** Ej. "11 de julio de 2026, 5:29:13 PM" — fecha en español, hora en 12 h con segundos. */
export function formatCredentialRenewalDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
  return `${datePart}, ${timePart}`;
}
