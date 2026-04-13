/**
 * En Cognito + Amplify, el campo `owner` de un modelo suele ser `sub::username`.
 * Las notificaciones usan solo el `sub` para alinearlo con `identityClaim("sub")`.
 */
export function recipientSubFromAmplifyOwner(owner: string | null | undefined): string | null {
  if (!owner?.trim()) return null;
  const t = owner.trim();
  const sep = t.indexOf("::");
  return sep === -1 ? t : t.slice(0, sep);
}
