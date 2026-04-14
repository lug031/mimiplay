const PREFIX = "mimiplay.onboarding.v1.done:";

/** Persistencia local por usuario (sub Cognito). */
export function isOnboardingCompleted(userSub: string): boolean {
  if (!userSub) return true;
  try {
    return globalThis.localStorage?.getItem(PREFIX + userSub) === "1";
  } catch {
    return true;
  }
}

export function setOnboardingCompleted(userSub: string): void {
  if (!userSub) return;
  try {
    globalThis.localStorage?.setItem(PREFIX + userSub, "1");
  } catch {
    /* ignore */
  }
}
