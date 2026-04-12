import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribePrefersReducedMotion(cb: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribePrefersReducedMotion, getPrefersReducedMotion, () => false);
}

type StreamCard = {
  id: string;
  name: string;
  planType: string;
  /** Precio mensual referencial en soles */
  monthlyS: string;
  cta: string;
  href: string;
  /** Gradiente tipo app streaming */
  gradient: string;
  /** Iniciales o emoji para el “logo” */
  mark: string;
};

const CARDS: StreamCard[] = [
  {
    id: "netflix",
    name: "Netflix",
    planType: "Premium · 4 pantallas",
    monthlyS: "S/24.90",
    cta: "Ver planes",
    href: "/catalogo?q=netflix",
    gradient: "from-[#b20710] via-[#e50914] to-[#831010]",
    mark: "N",
  },
  {
    id: "disney",
    name: "Disney+",
    planType: "Estándar con anuncios",
    monthlyS: "S/14.90",
    cta: "Ofertas",
    href: "/catalogo?q=disney",
    gradient: "from-[#0c2b4a] via-[#113ccf] to-[#0a1628]",
    mark: "D",
  },
  {
    id: "hbo",
    name: "HBO Max",
    planType: "Móvil · 1 dispositivo",
    monthlyS: "S/12.00",
    cta: "Ver planes",
    href: "/catalogo?q=hbo",
    gradient: "from-[#3d1a5c] via-[#582c8c] to-[#1a0a2e]",
    mark: "H",
  },
  {
    id: "spotify",
    name: "Spotify",
    planType: "Premium individual",
    monthlyS: "S/9.90",
    cta: "Música",
    href: "/catalogo?q=spotify",
    gradient: "from-[#117a36] via-[#1db954] to-[#0d4420]",
    mark: "♪",
  },
  {
    id: "prime",
    name: "Prime Video",
    planType: "Video + envíos",
    monthlyS: "S/11.50",
    cta: "Streaming",
    href: "/catalogo?q=prime",
    gradient: "from-[#0073a8] via-[#00a8e1] to-[#003d5c]",
    mark: "P",
  },
  {
    id: "apple",
    name: "Apple TV+",
    planType: "Suscripción mensual",
    monthlyS: "S/13.90",
    cta: "Explorar",
    href: "/catalogo?q=apple",
    gradient: "from-[#1c1c1e] via-[#2d2d30] to-[#000000]",
    mark: "▶",
  },
  {
    id: "paramount",
    name: "Paramount+",
    planType: "Essential",
    monthlyS: "S/10.90",
    cta: "Ver planes",
    href: "/catalogo?q=paramount",
    gradient: "from-[#0047ab] via-[#0064ff] to-[#001a44]",
    mark: "+",
  },
  {
    id: "crunchy",
    name: "Crunchyroll",
    planType: "Fan · sin offline",
    monthlyS: "S/8.00",
    cta: "Anime",
    href: "/catalogo?q=crunchyroll",
    gradient: "from-[#c45a12] via-[#f47521] to-[#7a2e0a]",
    mark: "C",
  },
];

function MarqueeCard({ card }: { card: StreamCard }) {
  return (
    <Link
      to={card.href}
      className={[
        "group/card relative flex min-h-[11.5rem] w-[min(17rem,calc(100vw-2.5rem))] shrink-0 flex-col justify-between overflow-hidden rounded-2xl",
        "border border-white/10 bg-gradient-to-br p-5 text-left text-white shadow-lg",
        "transition duration-300 ease-out will-change-transform",
        "hover:z-10 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/40",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        card.gradient,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/25 text-lg font-extrabold backdrop-blur-sm ring-1 ring-white/20">
          {card.mark}
        </div>
        <h3 className="mt-4 text-lg font-extrabold tracking-tight drop-shadow-sm">{card.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-white/80">{card.planType}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/15 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">desde / mes</p>
          <p className="text-xl font-extrabold tracking-tight">{card.monthlyS}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/25 transition group-hover/card:bg-white group-hover/card:text-mimi-black group-hover/card:ring-white">
          {card.cta}
        </span>
      </div>
    </Link>
  );
}

/**
 * Carril horizontal infinito (duplicado + translate). La animación se pausa al hacer hover sobre una tarjeta.
 */
export function StreamingMarqueeSection() {
  const reducedMotion = usePrefersReducedMotion();
  const loop = reducedMotion ? CARDS : [...CARDS, ...CARDS];

  return (
    <section
      className="relative border-b border-white/[0.06] bg-mimi-surface pt-10 pb-12 sm:pt-14 sm:pb-16"
      aria-label="Planes destacados en carrusel"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-mimi-surface to-transparent sm:w-16" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-mimi-surface to-transparent sm:w-16" aria-hidden />

      <div className="relative z-0 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Destacados</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Tendencias en streaming</h2>
          <p className="mt-2 text-sm text-white/55">
            Precios mensuales referenciales.
            {reducedMotion ? " Con movimiento reducido, desplázate horizontalmente para ver todas las tarjetas." : ""}
          </p>
        </div>
      </div>

      <div className={`relative z-0 pb-1 ${reducedMotion ? "overflow-x-auto" : "overflow-hidden"}`}>
        <div
          className={[
            "flex gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8",
            reducedMotion
              ? "w-max min-w-0 flex-nowrap justify-start"
              : "w-max animate-mimi-marquee will-change-transform has-[a:hover]:[animation-play-state:paused]",
          ].join(" ")}
        >
          {loop.map((card, i) => (
            <MarqueeCard key={`${card.id}-${i}`} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
