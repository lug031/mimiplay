import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Al cambiar de ruta, la vista vuelve arriba (p. ej. desde /#faq a /catalogo). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
