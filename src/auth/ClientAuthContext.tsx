import {
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
  type AuthUser,
} from "aws-amplify/auth";
import { sessionAdminGroups } from "@/lib/cognitoGroups";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const COGNITO_ADMIN_GROUP = "admin";

type ClientAuthContextValue = {
  user: AuthUser | null;
  userEmail: string | undefined;
  /** `true` si el JWT actual incluye el grupo Cognito `admin` (panel staff). */
  isStaffAdmin: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<
    "ok" | "new_password_required"
  >;
  completeNewPassword: (newPassword: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean; destination?: string }>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
};

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isStaffAdmin, setIsStaffAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      let session = await fetchAuthSession({ forceRefresh: false });
      let groups = sessionAdminGroups(session);
      if (groups.length === 0) {
        session = await fetchAuthSession({ forceRefresh: true });
        groups = sessionAdminGroups(session);
      }
      const staff = groups.includes(COGNITO_ADMIN_GROUP);
      setUser(u);
      setUserEmail(attrs.email);
      setIsStaffAdmin(staff);
    } catch {
      setUser(null);
      setUserEmail(undefined);
      setIsStaffAdmin(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const clearError = useCallback(() => setError(null), []);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await signIn({ username: email.trim(), password });
    const step = result.nextStep?.signInStep;
    if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      return "new_password_required";
    }
    if (result.isSignedIn) {
      await refreshUser();
      return "ok";
    }
    await refreshUser();
    return "ok";
  }, [refreshUser]);

  const completeNewPassword = useCallback(async (newPassword: string) => {
    setError(null);
    await confirmSignIn({ challengeResponse: newPassword });
    await refreshUser();
  }, [refreshUser]);

  const signOutUser = useCallback(async () => {
    setError(null);
    await signOut();
    await refreshUser();
  }, [refreshUser]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const trimmed = email.trim();
    const out = await signUp({
      username: trimmed,
      password,
      options: { userAttributes: { email: trimmed } },
    });
    const needsConfirmation = !out.isSignUpComplete;
    const dest =
      out.nextStep.signUpStep === "CONFIRM_SIGN_UP"
        ? (out.nextStep as { codeDeliveryDetails?: { destination?: string } }).codeDeliveryDetails?.destination
        : undefined;
    return { needsConfirmation, destination: dest };
  }, []);

  const confirmRegistration = useCallback(async (email: string, code: string) => {
    setError(null);
    await confirmSignUp({ username: email.trim(), confirmationCode: code.trim() });
  }, []);

  const value = useMemo<ClientAuthContextValue>(
    () => ({
      user,
      userEmail,
      isStaffAdmin,
      loading,
      error,
      clearError,
      refreshUser,
      signInWithEmailPassword,
      completeNewPassword,
      signOutUser,
      signUpWithEmail,
      confirmRegistration,
    }),
    [
      user,
      userEmail,
      isStaffAdmin,
      loading,
      error,
      clearError,
      refreshUser,
      signInWithEmailPassword,
      completeNewPassword,
      signOutUser,
      signUpWithEmail,
      confirmRegistration,
    ],
  );

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>;
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth debe usarse dentro de ClientAuthProvider");
  return ctx;
}
