import { Link } from "react-router-dom";

export function ClientHome() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Bienvenido</h1>
      <p className="mt-2 max-w-xl text-sm text-tcr-text-muted">
        Explora planes, crea un pedido con tu comprobante de pago y revisa el estado en{" "}
        <strong>Mis pedidos</strong>. Cuando el equipo confirme y entregue, verás tus credenciales en el detalle del
        pedido.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/catalogo"
          className="inline-flex rounded-full border border-tcr-border bg-white px-5 py-2 text-sm font-bold text-tcr-dark hover:border-tcr-teal"
        >
          Ver catálogo público
        </Link>
        <Link
          to="/app/planes"
          className="inline-flex rounded-full bg-tcr-teal px-5 py-2 text-sm font-bold text-white hover:bg-[#007a8f]"
        >
          Elegir plan y pedir
        </Link>
        <Link
          to="/app/pedidos"
          className="inline-flex rounded-full border border-tcr-teal px-5 py-2 text-sm font-bold text-tcr-teal hover:bg-tcr-bg"
        >
          Mis pedidos
        </Link>
      </div>
    </div>
  );
}
