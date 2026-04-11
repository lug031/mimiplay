import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AdminGate({ children }: Props) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchAuthSession();
        const groups =
          (session.tokens?.idToken?.payload["cognito:groups"] as
            | string[]
            | undefined) ?? [];
        if (!cancelled) {
          setState(groups.includes("admin") ? "ok" : "denied");
        }
      } catch {
        if (!cancelled) setState("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-manrope text-tcr-text-muted">
        Verificando permisos…
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center font-manrope">
        <h1 className="text-xl font-extrabold text-tcr-dark">Acceso de administrador</h1>
        <p className="mt-3 text-tcr-text-muted">
          Necesitas la cuenta del grupo <code className="text-tcr-teal">admin</code> en Cognito.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
