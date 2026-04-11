export function AdminQueuePage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Cola de asignación</h1>
      <p className="mt-2 text-sm text-tcr-text-muted">
        Pedidos en <code>PAYMENT_CONFIRMED</code> y <code>AUTO_MATCH_PROPOSED</code>, ordenados por fecha
        (FIFO). Lambda de auto-match en fase posterior.
      </p>
    </div>
  );
}
