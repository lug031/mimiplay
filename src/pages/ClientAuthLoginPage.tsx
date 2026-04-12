import { useClientAuth } from "@/auth/ClientAuthContext";
import type { ClientAuthOutletContext } from "@/components/auth/clientAuthOutletContext";
import { authFieldClass } from "@/components/auth/authFieldClass";
import { MimiButton } from "@/components/ui/MimiButton";
import { type FormEvent, useLayoutEffect, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";

export function ClientAuthLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLoginHeadline } = useOutletContext<ClientAuthOutletContext>();
  const returnUrl = searchParams.get("returnUrl") || "/catalogo";

  const { signInWithEmailPassword, completeNewPassword, loading: authLoading } = useClientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [phase, setPhase] = useState<"login" | "new_password">("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useLayoutEffect(() => {
    if (phase === "new_password") {
      setLoginHeadline({ title: "Nueva contraseña obligatoria", showFooterLink: false });
    } else {
      setLoginHeadline({ title: "Ingresa a tu cuenta", showFooterLink: true });
    }
  }, [phase, setLoginHeadline]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (phase === "new_password") {
      if (newPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      setPending(true);
      try {
        await completeNewPassword(newPassword);
        navigate(returnUrl.startsWith("/") ? returnUrl : `/${returnUrl}`, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña.");
      } finally {
        setPending(false);
      }
      return;
    }

    setPending(true);
    try {
      const next = await signInWithEmailPassword(email, password);
      if (next === "new_password_required") {
        setPhase("new_password");
        return;
      }
      navigate(returnUrl.startsWith("/") ? returnUrl : `/${returnUrl}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setPending(false);
    }
  }

  const busy = pending || authLoading;

  return phase === "login" ? (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="login-email">
          Correo electrónico
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          required
          className={authFieldClass}
          placeholder="mail@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          className={authFieldClass}
          placeholder="Introduce tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      <MimiButton type="submit" variant="primary" className="!w-full !py-3" disabled={busy}>
        {busy ? "Accediendo…" : "Acceso"}
      </MimiButton>
    </form>
  ) : (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-white/65">Define una contraseña definitiva para tu cuenta.</p>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="np1">
          Nueva contraseña
        </label>
        <input
          id="np1"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={authFieldClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="np2">
          Confirmar contraseña
        </label>
        <input
          id="np2"
          type="password"
          autoComplete="new-password"
          required
          className={authFieldClass}
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      <MimiButton type="submit" variant="primary" className="!w-full !py-3" disabled={busy}>
        {busy ? "Guardando…" : "Guardar y continuar"}
      </MimiButton>
    </form>
  );
}
