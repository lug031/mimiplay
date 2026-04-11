export function ClientOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Mis pedidos</h1>
      <p className="mt-2 text-sm text-tcr-text-muted">
        Modelo <code className="text-tcr-dark">CustomerOrder</code> con estado de flujo (pago → cola →
        asignación). Pendiente: formulario de nuevo pedido y listado GraphQL.
      </p>
    </div>
  );
}
