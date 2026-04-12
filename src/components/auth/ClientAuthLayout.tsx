import { AuthPageChrome } from "@/components/auth/AuthPageChrome";
import type { ClientAuthOutletContext } from "@/components/auth/clientAuthOutletContext";
import { useCallback, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";

const defaultLoginHeadline = { title: "Ingresa a tu cuenta", showFooterLink: true };

/**
 * Layout persistente para `/app/acceso/login` y `/app/acceso/registro` (React Router nested routes).
 * Conserva `returnUrl` en la query al alternar entre hermanos con `replace`.
 */
export function ClientAuthLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loginHeadline, setLoginHeadline] = useState(defaultLoginHeadline);

  const querySuffix = searchParams.toString();
  const qs = querySuffix ? `?${querySuffix}` : "";

  const isRegister = location.pathname.endsWith("/registro");
  const isLogin = location.pathname.endsWith("/login");

  const loginPath = `/app/acceso/login${qs}`;
  const registroPath = `/app/acceso/registro${qs}`;

  const setLoginHeadlineStable = useCallback((v: { title: string; showFooterLink: boolean }) => {
    setLoginHeadline(v);
  }, []);

  const outletContext = useMemo<ClientAuthOutletContext>(
    () => ({ setLoginHeadline: setLoginHeadlineStable }),
    [setLoginHeadlineStable],
  );

  const chromeTitle = isRegister ? "Crea tu cuenta MimiPlay" : isLogin ? loginHeadline.title : defaultLoginHeadline.title;

  const chromeFooter = isRegister ? (
    <p className="text-center text-sm text-white/65">
      ¿Ya tienes cuenta?{" "}
      <Link replace to={loginPath} className="font-bold text-white hover:underline">
        Acceso
      </Link>
    </p>
  ) : isLogin && loginHeadline.showFooterLink ? (
    <p className="text-center text-sm text-white/65">
      <Link replace to={registroPath} className="font-bold text-white hover:underline">
        ¿Aún no tienes cuenta? Crear una cuenta
      </Link>
    </p>
  ) : undefined;

  return (
    <AuthPageChrome title={chromeTitle} footer={chromeFooter}>
      <Outlet context={outletContext} />
    </AuthPageChrome>
  );
}
