import { useClientAuth } from "@/auth/ClientAuthContext";
import { authFieldClass } from "@/components/auth/authFieldClass";
import { MimiButton } from "@/components/ui/MimiButton";
import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function ClientAuthRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUpWithEmail, confirmRegistration } = useClientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [destination, setDestination] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const querySuffix = searchParams.toString();
  const loginWithSameQuery = `/app/acceso/login${querySuffix ? `?${querySuffix}` : ""}`;

  function goLoginAfterRegister() {
    navigate(loginWithSameQuery, { replace: true });
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setPending(true);
    try {
      const out = await signUpWithEmail(email, password);
      if (out.needsConfirmation) {
        setDestination(out.destination);
        setStep("confirm");
      } else {
        goLoginAfterRegister();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar.");
    } finally {
      setPending(false);
    }
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await confirmRegistration(email, code);
      goLoginAfterRegister();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código incorrecto o expirado.");
    } finally {
      setPending(false);
    }
  }

  return step === "form" ? (
    <form className="mt-6 space-y-4" onSubmit={onRegister}>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="reg-email">
          Correo electrónico
        </label>
        <input
          id="reg-email"
          type="email"
          required
          className={authFieldClass}
          placeholder="mail@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="reg-pass">
          Contraseña
        </label>
        <input
          id="reg-pass"
          type="password"
          required
          minLength={8}
          className={authFieldClass}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="reg-pass2">
          Confirmar contraseña
        </label>
        <input
          id="reg-pass2"
          type="password"
          required
          className={authFieldClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      <MimiButton type="submit" variant="primary" className="!w-full !py-3" disabled={pending}>
        {pending ? "Registrando…" : "Registrarme"}
      </MimiButton>
      <p className="text-center text-[11px] text-white/45">
        Al registrarte aceptas las condiciones de uso y la política de privacidad publicadas en la web.
      </p>
    </form>
  ) : (
    <form className="mt-6 space-y-4" onSubmit={onConfirm}>
      <p className="text-sm text-white/65">
        Introduce el código enviado
        {destination ? ` a ${destination}` : " a tu correo"}.
      </p>
      <div>
        <label className="block text-xs font-bold text-white/60" htmlFor="code">
          Código de verificación
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          className={`${authFieldClass} tracking-widest`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-mimi border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      <MimiButton type="submit" variant="primary" className="!w-full !py-3" disabled={pending}>
        {pending ? "Verificando…" : "Confirmar cuenta"}
      </MimiButton>
    </form>
  );
}
