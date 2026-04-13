import { Link } from "react-router-dom";

const WORDMARK_SRC = "/mimiplay.png";
const ICON_SRC = "/mimiplay.png";

type Props = {
  /** `wordmark`: logotipo completo. `icon`: marca compacta para barra superior. */
  variant?: "wordmark" | "icon";
  /** Altura visual del logo (ancho proporcional) */
  className?: string;
  heightClass?: string;
  /** Destino del enlace. Con `false` el logo no es clicable. */
  to?: string | false;
};

/**
 * Marca MimiPlay: wordmark en /public/mimiplay.png o icono en /public/logo-icono.png.
 * Pensado para fondos oscuros.
 */
export function MimiPlayLogo({
  variant = "wordmark",
  className = "",
  heightClass,
  to = "/",
}: Props) {
  const src = variant === "icon" ? ICON_SRC : WORDMARK_SRC;
  const defaultHeight = variant === "icon" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-9 sm:h-10";
  const img = (
    <img
      src={src}
      alt="MimiPlay"
      className={`object-contain ${variant === "icon" ? "object-center" : "w-auto object-left"} ${heightClass ?? defaultHeight} ${className}`}
      decoding="async"
    />
  );

  if (to === false) {
    return <span className="inline-flex shrink-0 items-center">{img}</span>;
  }

  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center rounded-mimi focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mimi-black"
    >
      {img}
    </Link>
  );
}
