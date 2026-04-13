import { useCallback, useEffect, useState } from "react";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 002.458 12c1.274 4.057 5.065 7 9.542 7 1.752 0 3.377-.448 4.815-1.225M6.228 6.228A9.959 9.959 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"
      />
    </svg>
  );
}

/** Icono “duplicar / copiar”: rectángulo delantero + hoja trasera (estilo Lucide, legible a 20px). */
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
      />
      <rect
        x="8"
        y="8"
        width="14"
        height="14"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const clientActionBtnClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-mimi border border-white/25 text-white/85 hover:bg-white/10 hover:text-white";

type CopyButtonProps = {
  text: string;
  variant: "client" | "admin";
  title?: string;
  /** Etiqueta accesible, p. ej. "Copiar correo". */
  copyLabel: string;
};

export function CredentialCopyButton({ text, variant, title = "Copiar", copyLabel }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const ok = await writeClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  const className =
    variant === "client"
      ? clientActionBtnClass
      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mimi-subtle hover:bg-mimi-black/[0.06] hover:text-mimi-black";

  return (
    <button
      type="button"
      onClick={onCopy}
      className={className}
      aria-label={copied ? "Copiado" : copyLabel}
      title={copied ? "Copiado" : title}
    >
      {copied ? <CheckIcon className="h-4 w-4 text-emerald-300" /> : <CopyIcon className="h-4 w-4" />}
    </button>
  );
}

type InputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Reinicia visibilidad al cambiar (p. ej. al cambiar de cuenta en edición). */
  resetKey?: string | null;
};

/** Campo contraseña con ojo; por defecto oculto (`type="password"`). */
export function PasswordRevealInput({ id, value, onChange, placeholder, className = "", resetKey }: InputProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [resetKey]);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="off"
        className={`w-full rounded-lg border border-mimi-black/12 py-2 pl-3 pr-10 font-mono text-sm ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-0.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-mimi-subtle hover:bg-mimi-black/[0.06] hover:text-mimi-black"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar" : "Mostrar"}
      >
        {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

type ReadonlyProps = {
  password: string;
  /** Al cambiar la contraseña cargada, vuelve a oculto. */
  resetKey?: string;
  variant?: "client" | "admin";
};

/** Contraseña en solo lectura con máscara y ojo (detalle pedido cliente). */
export function RevealablePasswordReadonly({ password, resetKey = password, variant = "client" }: ReadonlyProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [resetKey]);

  const masked = "•".repeat(Math.max(8, Math.min(password.length, 64)));

  const btnClass =
    variant === "client"
      ? clientActionBtnClass
      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mimi-subtle hover:bg-mimi-black/[0.06] hover:text-mimi-black";

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-x-1 gap-y-1">
      <span className="min-w-0 max-w-full break-all font-mono text-white">{visible ? password : masked}</span>
      <span className="inline-flex shrink-0 items-center gap-0.5">
        {variant === "client" ? (
          <CredentialCopyButton text={password} variant="client" copyLabel="Copiar contraseña" title="Copiar contraseña" />
        ) : null}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={btnClass}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={visible ? "Ocultar" : "Mostrar"}
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </span>
    </div>
  );
}

type ClientCopyableTextProps = {
  value: string;
  monospace?: boolean;
  copyLabel: string;
};

/** Fila de solo lectura con valor y botón copiar (detalle pedido cliente). */
export function ClientCopyableCredentialText({ value, monospace = true, copyLabel }: ClientCopyableTextProps) {
  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-x-1 gap-y-1">
      <span className={`min-w-0 max-w-full break-all text-white ${monospace ? "font-mono" : ""}`}>{value}</span>
      <CredentialCopyButton text={value} variant="client" copyLabel={copyLabel} title="Copiar" />
    </div>
  );
}
