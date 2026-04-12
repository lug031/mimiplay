import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { FooterSocialIcons } from "@/components/shell/FooterSocialIcons";
import { Link } from "react-router-dom";

const linkMuted = "text-sm font-semibold text-white/85 transition hover:text-white";

export function AppFooter() {
  return (
    <footer id="contacto" className="border-t border-white/10 bg-mimi-black pb-28 pt-14 text-white sm:pt-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8">
        <div>
          <MimiPlayLogo to="/" heightClass="h-12 sm:h-14 lg:h-16" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            Comercializamos accesos a cuentas de streaming, aplicaciones y servicios digitales.
          </p>
          <FooterSocialIcons />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Ayuda en línea</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href="#contacto" className={linkMuted}>
                Ponte en contacto con nosotros
              </a>
            </li>
            <li>
              <Link to="/catalogo" className={linkMuted}>
                Catálogo y precios
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Más información</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href="#faq" className={linkMuted}>
                Condiciones de uso
              </a>
            </li>
            <li>
              <a href="#faq" className={linkMuted}>
                Política de privacidad
              </a>
            </li>
            <li>
              <a href="#faq" className={linkMuted}>
                Cookies y consentimiento
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Guía de suscripciones</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/catalogo" className={linkMuted}>
                Ver todos
              </Link>
            </li>
            <li>
              <Link to="/catalogo" className={linkMuted}>
                Netflix, Disney+ y similares
              </Link>
            </li>
            <li>
              <Link to="/catalogo" className={linkMuted}>
                Movistar TV, IPTV y similares
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 px-4 pt-8 text-xs text-white/45 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} MimiPlay</p>
        <p className="text-center sm:text-right">Los accesos dependen de stock y de las políticas de cada plataforma.</p>
      </div>
    </footer>
  );
}
