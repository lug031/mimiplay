import { Link } from "react-router-dom";

const cards = [
  {
    to: "/admin/catalogo",
    title: "Catálogo",
    desc: "Define plataformas y anuncios (precio, vigencia, tarjeta en tienda) visibles para la venta.",
  },
  {
    to: "/admin/pedidos",
    title: "Pedidos",
    desc: "Cola de comprobantes, confirmación de pago y entrega. Incluye la pestaña Vigencia por pedido (fin del acceso contratado, no de la cuenta web).",
  },
  {
    to: "/admin/informes",
    title: "Informes",
    desc: "Dashboard con gráficos (barras, líneas, pastel) y todos los CSV de la aplicación (vigencia, clientes, etc.).",
  },
  {
    to: "/admin/clientes",
    title: "Clientes",
    desc: "CRM-lite: ranking por titular, ticket medio y enlaces a pedidos. Las exportaciones van desde Informes.",
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
        Operación comercial de MimiPlay: publicar oferta (catálogo), alimentar stock (inventario), validar pagos y cerrar
        ventas con entrega de credenciales al comprador.
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
