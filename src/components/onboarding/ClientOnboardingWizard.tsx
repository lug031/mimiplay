import { useClientAuth } from "@/auth/ClientAuthContext";
import { isOnboardingCompleted, setOnboardingCompleted } from "@/lib/onboardingStorage";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type Step = {
  title: string;
  body: ReactNode;
  /** Botón extra bajo el texto (p. ej. ir al catálogo). */
  action?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    title: "Bienvenido a MimiPlay",
    body: (
      <>
        Esta guía rápida te muestra cómo <strong className="text-white">comprar un acceso</strong>, seguir tu pedido y, si
        hace falta, <strong className="text-white">abrir un reclamo</strong>. Usa <em>Anterior</em> y <em>Siguiente</em>{" "}
        para avanzar, o salta cuando quieras.
      </>
    ),
  },
  {
    title: "Explora el catálogo",
    body: (
      <>
        En el <strong className="text-white">catálogo</strong> verás anuncios por plataforma (streaming, apps, etc.) con
        precio en soles y duración. Puedes buscar o filtrar antes de elegir.
      </>
    ),
    action: { label: "Ir al catálogo", to: "/catalogo" },
  },
  {
    title: "Elige un anuncio",
    body: (
      <>
        Abre la tarjeta que te interese: revisa el resumen, precio y opciones. El botón de compra te lleva a{" "}
        <strong className="text-white">iniciar el pedido</strong> con ese anuncio ya seleccionado.
      </>
    ),
  },
  {
    title: "Pedido y plan",
    body: (
      <>
        En la pantalla de nuevo pedido confirma tus datos de pago, elige la <strong className="text-white">variante del plan</strong>{" "}
        si el anuncio ofrece varias opciones (duración o precio) y continúa. Ahí podrás subir tu comprobante cuando corresponda.
      </>
    ),
    action: { label: "Ver mis pedidos (después de comprar)", to: "/app/pedidos" },
  },
  {
    title: "Confirma y sigue tu pedido",
    body: (
      <>
        Tras enviar el comprobante, el equipo valida el pago y te entrega las credenciales. En{" "}
        <strong className="text-white">Mis pedidos</strong> ves el estado (comprobante enviado, entregado, etc.) y el detalle
        de cada compra.
      </>
    ),
    action: { label: "Abrir Mis pedidos", to: "/app/pedidos" },
  },
  {
    title: "Reclamos",
    body: (
      <>
        Si algo no coincide con tu pedido, entra en <strong className="text-white">Reclamos</strong>, elige el pedido
        afectado, describe el problema y opcionalmente adjunta una imagen. Cuando lo revisemos, verás la{" "}
        <strong className="text-white">respuesta aquí mismo</strong>.
      </>
    ),
    action: { label: "Ir a reclamos", to: "/app/reclamos" },
  },
  {
    title: "¡Listo!",
    body: (
      <>
        Ya puedes usar el catálogo con tranquilidad. Recuerda: <strong className="text-white">Catálogo → pedido → Mis pedidos</strong>
        , y <strong className="text-white">Reclamos</strong> si necesitas ayuda formal sobre un pedido concreto.
      </>
    ),
  },
];

export function ClientOnboardingWizard() {
  const { user, loading, isStaffAdmin } = useClientAuth();
  const { pathname } = useLocation();
  const sub = user?.userId ?? "";
  const [done, setDone] = useState(() => isOnboardingCompleted(sub));
  const [step, setStep] = useState(0);

  useEffect(() => {
    setDone(isOnboardingCompleted(sub));
  }, [sub]);

  const finish = useCallback(() => {
    if (sub) setOnboardingCompleted(sub);
    setDone(true);
  }, [sub]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }, [step, finish]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    if (loading || !user || isStaffAdmin || done || !sub) return;
    if (
      pathname.startsWith("/app/acceso") ||
      pathname === "/app/login" ||
      pathname === "/app/registro"
    ) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [loading, user, isStaffAdmin, done, sub, pathname, skip]);

  if (loading || !user || isStaffAdmin || done || !sub) {
    return null;
  }

  /** No molestar en pantallas de solo auth. */
  if (
    pathname.startsWith("/app/acceso") ||
    pathname === "/app/login" ||
    pathname === "/app/registro"
  ) {
    return null;
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-mimi-black/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-mimi-elevated p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/45">
            Paso {step + 1} de {STEPS.length}
          </p>
          <button
            type="button"
            onClick={skip}
            className="shrink-0 text-[11px] font-bold text-white/45 underline decoration-white/25 underline-offset-2 hover:text-white/80"
          >
            Saltar guía
          </button>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <h2 id="onboarding-title" className="mt-5 text-xl font-extrabold leading-tight text-white sm:text-2xl">
          {current.title}
        </h2>
        <div id="onboarding-desc" className="mt-3 text-sm leading-relaxed text-white/75">
          {current.body}
        </div>

        {current.action ? (
          <div className="mt-5">
            <Link
              to={current.action.to}
              className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/15"
              onClick={() => {
                /* opcional: no cerrar el modal para que siga viendo los pasos */
              }}
            >
              {current.action.label} →
            </Link>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Anterior
          </button>
          <div className="flex gap-2">
            {!isLast ? (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-mimi-black shadow-sm transition hover:bg-neutral-200"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-mimi-black shadow-sm transition hover:bg-neutral-200"
              >
                Empezar a usar MimiPlay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
