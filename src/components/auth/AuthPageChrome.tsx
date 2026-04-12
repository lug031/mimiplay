import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";

type AuthPageChromeProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Login / registro: panel sin navbar global; logo + opcional “Atrás”, formulario e imagen lateral.
 */
export function AuthPageChrome({ title, subtitle, children, footer }: AuthPageChromeProps) {
  const navigate = useNavigate();
  const [showBack] = useState(
    () => typeof window !== "undefined" && window.history.length > 1,
  );

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <section className="order-2 flex flex-col justify-start px-6 pb-10 pt-6 sm:px-10 sm:pb-12 sm:pt-8 lg:order-1 lg:px-14 lg:pt-12 xl:px-20 xl:pt-16">
        <div className="mx-auto w-full max-w-md">
          {showBack ? (
            <div className="mb-3">
              <MimiButton
                type="button"
                variant="ghost"
                className="!-ml-2 !px-2 !py-1.5 !text-sm font-semibold text-white/75 hover:text-white"
                onClick={handleBack}
              >
                ← Atrás
              </MimiButton>
            </div>
          ) : null}
          <div className="mb-5">
            <MimiPlayLogo to="/" heightClass="h-[7rem] sm:h-[8rem]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-white/55">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </section>

      <aside
        className="relative order-1 min-h-[11rem] shrink-0 sm:min-h-[13rem] lg:order-2 lg:min-h-0"
        aria-hidden
      >
        <img
          src="/mimiplay-auth-hero.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-mimi-black lg:bg-gradient-to-l lg:from-mimi-black lg:via-black/40 lg:to-transparent" />
      </aside>
    </div>
  );
}
