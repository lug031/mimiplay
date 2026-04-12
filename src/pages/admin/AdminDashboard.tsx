import { Link } from "react-router-dom";

const cards = [
  {
    to: "/admin/catalogo",
    title: "Catálogo",
    desc: "Define plataformas y anuncios (precio, vigencia, tarjeta en tienda) visibles para la venta.",
  },
  {
    to: "/admin/cola",
    title: "Cola",
    desc: "Pedidos con comprobante cargado: revisión de pago y decisión de avance o cancelación.",
  },
  {
    to: "/admin/pedidos",
    title: "Todos los pedidos",
    desc: "Pipeline completo de ventas: filtra por estado, confirma pagos y registra la entrega de accesos.",
  },
  {
    to: "/admin/inventario",
    title: "Inventario",
    desc: "Stock de cuentas por plataforma para cubrir pedidos validados y asignaciones manuales.",
  },
];

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-mimi-black">Panel administrador</h1>
      <p className="mt-2 max-w-2xl text-sm text-mimi-subtle">
        Operación comercial de MimiPlay: publicar oferta (catálogo), alimentar stock (inventario), validar pagos (cola)
        y cerrar ventas con entrega de credenciales al comprador.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-mimi-black/12 bg-white p-5 shadow-sm transition hover:border-mimi-black/28 hover:shadow-md"
          >
            <h2 className="text-lg font-extrabold text-mimi-black">{c.title}</h2>
            <p className="mt-2 text-sm text-mimi-subtle">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
