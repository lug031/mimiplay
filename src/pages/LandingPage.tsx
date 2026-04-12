import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";
import { StreamingMarqueeSection } from "@/components/marketplace/StreamingMarqueeSection";
import { AppFooter } from "@/components/shell/AppFooter";
import { AppNavbar } from "@/components/shell/AppNavbar";
import { MimiPlayFloatingChat } from "@/components/support/MimiPlayFloatingChat";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CATEGORY_CHIPS: { key: string; label: string; icon: string }[] = [
  { key: "STREAMING", label: "Streaming", icon: "▶" },
  { key: "SPORTS", label: "Deportes / TV", icon: "⚽" },
  { key: "PC_APP", label: "Apps PC", icon: "🖥" },
  { key: "OTHER", label: "Otros", icon: "✦" },
  { key: "ALL", label: "Inteligencia artificial", icon: "✨" },
  { key: "ALL2", label: "Video", icon: "🎬" },
  { key: "ALL3", label: "Música", icon: "🎵" },
  { key: "ALL4", label: "Videojuegos", icon: "🎮" },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "¿Cuánto cuesta el servicio?",
    a: "Cada plan publica precio y vigencia en días. Pagas el monto del plan contratado; no cobramos registro en la web.",
  },
  {
    q: "¿Qué es MimiPlay?",
    a: "Es una plataforma comercial para adquirir accesos a cuentas de streaming, apps y servicios digitales asociados: eliges plan, registras el pago con comprobante y recibes las credenciales cuando la compra quede validada, según disponibilidad de stock y las condiciones de cada proveedor externo.",
  },
  {
    q: "¿Puedo cancelar un pedido?",
    a: "Según la etapa del pedido (antes o después de validar el pago) aplican políticas de cancelación distintas. Revisa el detalle del pedido en tu área de cliente o consulta las condiciones comerciales vigentes.",
  },
  {
    q: "¿Cómo contacto soporte?",
    a: "Puedes usar los canales de atención que MimiPlay habilite (correo, mensajería o teléfono) además del seguimiento en línea de tu pedido para dudas sobre pago, plazos y entrega.",
  },
  {
    q: "¿Cómo recibo el acceso contratado?",
    a: "Cuando el pago quede acreditado según el proceso comercial, se asigna un acceso desde inventario y las credenciales quedan disponibles en el detalle del pedido en tu cuenta, salvo incidencias operativas que se comuniquen por el mismo canal.",
  },
];

function WaveDivider() {
  return (
    <div className="pointer-events-none relative -mb-px h-16 w-full min-w-full max-w-none leading-none sm:h-24" aria-hidden>
      <svg
        className="absolute bottom-0 left-0 block h-full w-full min-w-full text-mimi-surface"
        preserveAspectRatio="none"
        viewBox="0 0 1440 120"
      >
        <path
          fill="currentColor"
          d="M0,64 C240,120 480,0 720,56 C960,112 1200,8 1440,48 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    if (window.location.hash !== "#faq") return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/catalogo?q=${encodeURIComponent(q)}`);
    else navigate("/catalogo");
  }

  return (
    <div className="min-h-screen bg-mimi-black font-manrope text-white">
      <div className="relative bg-mimi-black text-white">
        <AppNavbar marketingExtras />

        <section id="inicio" className="relative pb-0 pt-10 sm:pt-14 lg:pt-16">
          <div className="mx-auto max-w-5xl px-4 pb-6 text-center sm:px-6 sm:pb-8 lg:px-8">
            <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              <span className="text-white/90">Mimi </span>
              <span className="text-white">PLAY</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
              Comercializamos accesos a cuentas para distintas plataformas (streaming, apps y servicios digitales).
              Consulta planes, formaliza tu pago con comprobante y da seguimiento a tu compra desde tu cuenta.
            </p>

            <form
              onSubmit={onSearchSubmit}
              className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0"
            >
              <div className="relative flex flex-1 items-center rounded-full border border-white/20 bg-white/10 shadow-inner backdrop-blur sm:rounded-r-none sm:border-r-0">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Netflix, Disney+, Spotify…"
                  className="h-12 w-full min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm text-white placeholder:text-white/40 outline-none sm:h-14 sm:rounded-r-none sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="h-12 shrink-0 rounded-full border border-white/20 bg-white px-6 text-sm font-extrabold text-mimi-black transition hover:bg-neutral-200 sm:h-14 sm:rounded-l-none sm:rounded-r-full sm:border-l-0"
              >
                Buscar
              </button>
            </form>

            <div className="mt-8 flex justify-center">
              <div className="-mx-4 flex max-w-full gap-2 overflow-x-auto px-4 pb-2 scrollbar-thin sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
                {CATEGORY_CHIPS.map((c) => (
                  <Link
                    key={c.key}
                    to={c.key.startsWith("ALL") ? "/catalogo" : `/catalogo`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 transition hover:border-white/35 hover:bg-white/10 sm:text-sm"
                  >
                    <span className="opacity-80">{c.icon}</span>
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-10 pb-2">
              <MimiButton to="/catalogo" variant="primary" className="!px-10 !py-3.5 !text-base sm:!px-14 sm:!py-4 sm:!text-lg">
                Empieza ahora
              </MimiButton>
            </div>
          </div>

          <WaveDivider />
        </section>
      </div>

      <StreamingMarqueeSection />

      {/* ——— CTA + FAQ ——— */}
      <section className="border-t border-white/10 bg-mimi-black py-14 text-white sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex shrink-0 justify-center sm:justify-start">
              <MimiPlayLogo to={false} heightClass="h-24 w-auto sm:h-28" className="max-w-[10rem] sm:max-w-[11rem]" />
            </div>
          <div className="max-w-xl flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              ¿Listo para <span className="text-white">comprar</span>? Abre tu cuenta comercial
            </h2>
            <div className="mx-auto mt-2 h-0.5 w-48 rounded-full bg-white/40 sm:mx-0" aria-hidden />
          </div>
          <div className="max-w-xs text-center sm:text-left">
            <p className="text-sm text-white/70">
              Registro sin costo: accede al catálogo de planes, genera pedidos con comprobante de pago y gestiona tus compras de accesos en un solo
              lugar.
            </p>
            <MimiButton to="/app/acceso/registro" variant="primary" className="mt-5 !inline-flex !gap-2 !px-6 !py-3 !text-sm">
              → Crea mi cuenta
            </MimiButton>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-20 border-t border-white/10 bg-mimi-surface py-14 sm:scroll-mt-24 sm:py-16"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">Preguntas más frecuentes</h2>
          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {FAQ_ITEMS.map((item, i) => {
              const open = faqOpen === i;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-bold text-white sm:text-base">{item.q}</span>
                    <span className={`text-xl font-light text-white/70 transition ${open ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {open && <p className="pb-5 text-sm leading-relaxed text-white/65">{item.a}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <AppFooter />

      <MimiPlayFloatingChat />
    </div>
  );
}
