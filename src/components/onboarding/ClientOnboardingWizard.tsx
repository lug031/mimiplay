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

/** Por paso: elemento con `data-onboarding-target` a resaltar, o null. */
const STEP_HIGHLIGHT: (string | null)[] = [null, "catalogo", "catalogo", "pedidos", "pedidos", "reclamos", null];

const SPOTLIGHT_CLASSES = [
  "onboarding-spotlight",
  "relative",
  "z-[60]",
  "rounded-lg",
  "ring-2",
  "ring-amber-400",
  "ring-offset-2",
  "ring-offset-mimi-black",
] as const;

function isElementVisible(el: Element): boolean {
  const html = el as HTMLElement;
  const r = html.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const st = window.getComputedStyle(html);
  if (st.visibility === "hidden" || st.display === "none") return false;
  return true;
}

function firstVisibleTarget(target: string): HTMLElement | null {
  const nodes = document.querySelectorAll(`[data-onboarding-target="${target}"]`);
  for (const el of nodes) {
    if (isElementVisible(el)) return el as HTMLElement;
  }
  return null;
}

/** En vista móvil, Mis pedidos / Reclamos están en el menú; se usa el botón ☰ como referencia. */
function resolveHighlightElement(target: string | null): HTMLElement | null {
  if (!target) return null;
  let el = firstVisibleTarget(target);
  if (el) return el;
  if (target === "pedidos" || target === "reclamos") {
    el = firstVisibleTarget("cuenta-movil");
  }
  return el;
}

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

  const onboardingActive =
    !loading && !!user && !isStaffAdmin && !!sub && !done && !pathname.startsWith("/app/acceso") && pathname !== "/app/login" && pathname !== "/app/registro";

  useEffect(() => {
    if (!onboardingActive) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onboardingActive, skip]);

  useEffect(() => {
    if (!onboardingActive) return;

    function clearSpotlight() {
      document.querySelectorAll(".onboarding-spotlight").forEach((node) => {
        SPOTLIGHT_CLASSES.forEach((c) => node.classList.remove(c));
      });
    }

    function applySpotlight(opts: { scrollIntoView: boolean }) {
      clearSpotlight();
      const target = STEP_HIGHLIGHT[step] ?? null;
      const el = resolveHighlightElement(target);
      if (el) {
        SPOTLIGHT_CLASSES.forEach((c) => el.classList.add(c));
        if (opts.scrollIntoView) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      }
    }

    applySpotlight({ scrollIntoView: true });
    function onResize() {
      applySpotlight({ scrollIntoView: false });
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearSpotlight();
    };
  }, [onboardingActive, step]);

  if (!onboardingActive) {
    return null;
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] flex justify-center p-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end"
      role="region"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/15 bg-mimi-elevated/98 p-4 shadow-2xl backdrop-blur-sm sm:max-w-md sm:p-5">
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
            className="h-full rounded-full bg-amber-400/90 transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <h2 id="onboarding-title" className="mt-4 text-lg font-extrabold leading-tight text-white sm:text-xl">
          {current.title}
        </h2>
        <div id="onboarding-desc" className="mt-2 max-h-[40vh] overflow-y-auto text-sm leading-relaxed text-white/75 sm:max-h-none">
          {current.body}
        </div>

        {current.action ? (
          <div className="mt-4">
            <Link
              to={current.action.to}
              className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/15"
            >
              {current.action.label} →
            </Link>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Anterior
          </button>
          <div className="flex gap-2">
            {!isLast ? (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-mimi-black shadow-sm transition hover:bg-neutral-200"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-mimi-black shadow-sm transition hover:bg-neutral-200"
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
