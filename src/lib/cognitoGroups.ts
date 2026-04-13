/** Normaliza el claim cognito:groups (array o string si solo hay un grupo). */
export function readCognitoGroups(payload: Record<string, unknown> | undefined): string[] {
  if (!payload) return [];
  const raw = payload["cognito:groups"];
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter((g): g is string => typeof g === "string");
  if (typeof raw === "string") return [raw];
  return [];
}

/** Email en el ID token (claim `email`), útil si `fetchUserAttributes` falla tras recarga en frío. */
export function emailFromIdToken(session: {
  tokens?: {
    idToken?: { payload?: Record<string, unknown> } | null;
  } | null;
}): string | undefined {
  const raw = session.tokens?.idToken?.payload?.email;
  return typeof raw === "string" ? raw : undefined;
}

/** Une grupos del id token y del access token (por si el IdP solo rellena uno de los dos). */
export function sessionAdminGroups(session: {
  tokens?: {
    idToken?: { payload?: Record<string, unknown> } | null;
    accessToken?: { payload?: Record<string, unknown> } | null;
  } | null;
}): string[] {
  const id = readCognitoGroups(session.tokens?.idToken?.payload);
  const access = readCognitoGroups(session.tokens?.accessToken?.payload);
  return [...new Set([...id, ...access])];
}
