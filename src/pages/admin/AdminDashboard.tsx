import { Link } from "react-router-dom";

const cards = [
  {
    to: "/admin/catalogo",
    title: "Catálogo",
    desc: "Plataformas (Netflix, Prime…) y planes con precio y duración.",
  },
  {
    to: "/admin/cola",
    title: "Cola",
    desc: "Pedidos con comprobante enviado: confirmar pago o cancelar.",
  },
  {
    to: "/admin/pedidos",
    title: "Todos los pedidos",
    desc: "Filtrar por estado y entregar credenciales tras pago confirmado.",
  },
  {
    to: "/admin/inventario",
    title: "Inventario",
    desc: "Cuentas disponibles para asignar manualmente al entregar.",
  },
];

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Panel administrador</h1>
      <p className="mt-2 text-sm text-tcr-text-muted">
        Flujo típico: cargar catálogo e inventario → revisar cola → confirmar pago → entregar credenciales al cliente.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-tcr-border bg-white p-5 shadow-sm transition hover:border-tcr-teal"
          >
            <h2 className="text-lg font-extrabold text-tcr-teal">{c.title}</h2>
            <p className="mt-2 text-sm text-tcr-text-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
