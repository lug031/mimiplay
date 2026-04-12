import { useClientAuth } from "@/auth/ClientAuthContext";
import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";
import { MimiCard } from "@/components/ui/MimiCard";
import { type FormEvent, useState } from "react";

const field =
  "mt-1 w-full rounded-mimi border border-white/15 bg-mimi-black px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/30";

export function AdminLoginPage() {
  const { signInWithEmailPassword, completeNewPassword, loading: authLoading } = useClientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [phase, setPhase] = useState<"login" | "new_password">("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setPending(false);
    }
  }

  const busy = pending || authLoading;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mimi-black px-4 py-12 font-manrope text-white">
      <div className="mb-8 flex flex-col items-center text-center">
        <MimiPlayLogo to={false} heightClass="h-10" />
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-mimi-muted">Acceso administración</p>
      </div>

      <MimiCard variant="dark" padding="lg" className="w-full max-w-md border border-white/10 bg-mimi-elevated">
        <h1 className="text-center text-lg font-extrabold text-white">
          {phase === "new_password" ? "Nueva contraseña obligatoria" : "Iniciar sesión"}
        </h1>

        {phase === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-bold text-white/60" htmlFor="adm-email">
                Correo
              </label>
              <input
                id="adm-email"
                type="email"
                autoComplete="username"
                required
                className={field}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60" htmlFor="adm-pass">
                Contraseña
              </label>
              <input
                id="adm-pass"
                type="password"
                autoComplete="current-password"
                required
                className={field}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
            )}
            <MimiButton type="submit" variant="primary" className="!w-full !py-3" disabled={busy}>
              {busy ? "Entrando…" : "Entrar al panel"}
            </MimiButton>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <p className="text-sm text-white/65">Define una contraseña definitiva para continuar.</p>
            <div>
              <label className="block text-xs font-bold text-white/60" htmlFor="adm-np1">
                Nueva contraseña
              </label>
              <input
                id="adm-np1"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={field}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60" htmlFor="adm-np2">
                Confirmar
              </label>
              <input
                id="adm-np2"
                type="password"
                autoComplete="new-password"
                required
                className={field}
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
        )}

      </MimiCard>
    </div>
  );
}
