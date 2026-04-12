import { useEffect } from "react";
import { Link } from "react-router-dom";

function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-visible");
            e.target.classList.remove("reveal-hidden");
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => {
      el.classList.add("reveal-hidden");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

export function LandingPage() {
  useRevealOnScroll();

  return (
    <div className="min-h-screen bg-white font-manrope text-tcr-dark">
      <header className="sticky top-0 z-50 border-b border-tcr-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="shrink-0 text-lg font-extrabold tracking-tight">
            Mimi<span className="text-tcr-teal">Play</span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex">
            <a href="#como-funciona" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-tcr-bg">
              Cómo funciona
            </a>
            <Link to="/catalogo" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-tcr-bg">
              Catálogo
            </Link>
            <a href="#contacto" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-tcr-bg">
              Contacto
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/app/inicio"
              className="hidden items-center gap-1.5 text-sm font-bold hover:text-tcr-teal sm:flex"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/app/inicio"
              className="rounded-full bg-tcr-teal px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#007a8f]"
            >
              Mi cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16">
          <div className="hero-pattern absolute inset-0 -z-10 opacity-60" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center" data-reveal>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Cuentas de streaming y apps, sin esperas interminables
              </h1>
              <p className="mt-6 text-lg text-tcr-text-muted sm:text-xl">
                Elige plan, paga con comprobante y recibe acceso desde tu panel. Menos mensajes
                repetidos, más trazabilidad para ti y para MimiPlay.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <Link
                  to="/app/inicio"
                  className="inline-flex items-center gap-2 rounded-full bg-tcr-teal px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#007a8f]"
                >
                  Entrar al portal
                </Link>
                <Link
                  to="/catalogo"
                  className="rounded-2xl border border-tcr-border bg-white px-5 py-3 text-sm font-bold shadow-sm hover:border-tcr-teal"
                >
                  Ver catálogo y precios
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-tcr-border bg-tcr-bg py-16" data-reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-extrabold sm:text-3xl">Cómo funciona</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  t: "1. Eliges servicio",
                  d: "Streaming, deportes o apps de PC: mismos precios y planes que ya conoces.",
                },
                {
                  t: "2. Pagas y subes comprobante",
                  d: "Yape, Plin u otros métodos; la plataforma guarda tu boleta vinculada al pedido.",
                },
                {
                  t: "3. Confirmación y credenciales",
                  d: "El equipo valida, asigna cuenta desde inventario (auto o manual) y ves todo en tu panel.",
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-2xl border border-tcr-border bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-extrabold text-tcr-teal">{x.t}</h3>
                  <p className="mt-2 text-sm text-tcr-text-muted">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="catalogo" className="py-16" data-reveal>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-extrabold sm:text-3xl">Catálogo en vivo</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-tcr-text-muted">
              Planes y precios cargados desde la nube. Para comprar necesitas una cuenta en el portal.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/catalogo"
                className="inline-flex rounded-full bg-tcr-teal px-8 py-3 text-sm font-bold text-white hover:bg-[#007a8f]"
              >
                Abrir catálogo completo
              </Link>
            </div>
          </div>
        </section>

        <section id="contacto" className="border-t border-tcr-border bg-tcr-dark py-16 text-white" data-reveal>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-extrabold">¿Sigues en WhatsApp?</h2>
            <p className="mt-3 text-sm text-white/80">
              La web complementa tus canales: Telegram, Discord y grupos siguen para avisos masivos.
            </p>
            <Link
              to="/app/inicio"
              className="mt-8 inline-flex rounded-full bg-tcr-teal px-8 py-3 text-sm font-bold text-white hover:bg-[#007a8f]"
            >
              Ir al portal de cliente
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-tcr-border py-8 text-center text-xs text-tcr-text-muted">
        MimiPlay · Panel React + AWS Amplify Gen 2
      </footer>
    </div>
  );
}
