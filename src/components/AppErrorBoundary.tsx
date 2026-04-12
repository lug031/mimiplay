import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Captura fallos de renderizado en el árbol de la app y muestra una vista de respaldo en lugar de pantalla en blanco.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[AppErrorBoundary]", error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-mimi-black px-6 pb-16 pt-12 font-manrope text-center text-white">
          <MimiPlayLogo to={false} heightClass="h-14 sm:h-16" className="mx-auto" />
          <h1 className="mt-10 text-xl font-extrabold tracking-tight sm:text-2xl">Ha ocurrido un error</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 sm:text-base">
            Lo estamos solucionando. Puedes intentar de nuevo en unos minutos o recargar la página.
          </p>
          <button
            type="button"
            className="mt-10 rounded-full bg-white px-8 py-3 text-sm font-extrabold text-mimi-black transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
