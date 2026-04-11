import { Link } from "react-router-dom";

export function ClientHome() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Bienvenido</h1>
      <p className="mt-2 max-w-xl text-sm text-tcr-text-muted">
        Aquí verás el catálogo, el estado de tus pedidos y las credenciales cuando el administrador confirme la
        asignación. La siguiente iteración conectará listados con{" "}
        <code className="text-tcr-teal">dataClient</code> (AppSync).
      </p>
      <Link
        to="/app/pedidos"
        className="mt-6 inline-flex rounded-full bg-tcr-teal px-5 py-2 text-sm font-bold text-white hover:bg-[#007a8f]"
      >
        Ir a mis pedidos
      </Link>
    </div>
  );
}
