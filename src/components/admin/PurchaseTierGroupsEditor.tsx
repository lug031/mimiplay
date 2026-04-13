import type { AdminTierGroupDraft, AdminTierRowDraft } from "@/lib/purchaseOptions";
import { emptyAdminTierGroup, emptyAdminTierRow } from "@/lib/purchaseOptions";

type Props = {
  value: AdminTierGroupDraft[];
  onChange: (next: AdminTierGroupDraft[]) => void;
  disabled?: boolean;
  /** Texto de ayuda bajo el título de la sección */
  hint?: string;
};

/**
 * Editor de bloques de precio (grupo + filas de vigencia / S/.).
 * Los ids de grupo y tier se generan al guardar (estables por posición y texto).
 */
export function PurchaseTierGroupsEditor({ value, onChange, disabled, hint }: Props) {
  function updateGroup(index: number, patch: Partial<AdminTierGroupDraft>) {
    const next = value.map((g, i) => (i === index ? { ...g, ...patch } : g));
    onChange(next);
  }

  function updateRow(gi: number, ri: number, patch: Partial<AdminTierRowDraft>) {
    const next = value.map((g, i) => {
      if (i !== gi) return g;
      const rows = g.rows.map((r, j) => (j === ri ? { ...r, ...patch } : r));
      return { ...g, rows };
    });
    onChange(next);
  }

  function addGroup() {
    onChange([...value, emptyAdminTierGroup()]);
  }

  function removeGroup(gi: number) {
    onChange(value.filter((_, i) => i !== gi));
  }

  function addRow(gi: number) {
    const next = value.map((g, i) => (i === gi ? { ...g, rows: [...g.rows, emptyAdminTierRow()] } : g));
    onChange(next);
  }

  function removeRow(gi: number, ri: number) {
    const next = value.map((g, i) => {
      if (i !== gi) return g;
      const rows = g.rows.filter((_, j) => j !== ri);
      return { ...g, rows: rows.length > 0 ? rows : [emptyAdminTierRow()] };
    });
    onChange(next);
  }

  const inputDisabled = Boolean(disabled);

  return (
    <div className="space-y-4">
      {hint ? <p className="text-[11px] leading-snug text-mimi-muted">{hint}</p> : null}

      {value.length === 0 ? (
        <p className="text-xs text-mimi-subtle">No hay bloques de precio. Añade uno para definir vigencias y precios (S/.).</p>
      ) : null}

      {value.map((group, gi) => (
        <div
          key={group.id}
          className="space-y-3 rounded-lg border border-dashed border-mimi-black/18 bg-mimi-black/[0.02] p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-mimi-black/10 pb-3">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <input
                className="min-w-[10rem] flex-1 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                placeholder="Título del bloque (opcional)"
                disabled={inputDisabled}
                value={group.title}
                onChange={(e) => updateGroup(gi, { title: e.target.value })}
              />
              <input
                className="w-14 rounded border border-mimi-black/12 px-2 py-1.5 text-center text-xs"
                placeholder="💎"
                title="Emoji opcional"
                disabled={inputDisabled}
                value={group.emoji}
                onChange={(e) => updateGroup(gi, { emoji: e.target.value })}
              />
            </div>
            <button
              type="button"
              disabled={inputDisabled}
              className="shrink-0 rounded-full border border-mimi-black/15 px-2.5 py-1 text-[11px] font-bold text-mimi-subtle hover:border-red-300 hover:text-red-800 disabled:opacity-50"
              onClick={() => removeGroup(gi)}
            >
              Quitar bloque
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-mimi-subtle">Planes en este bloque</p>
            {group.rows.map((row, ri) => (
              <div key={row.id} className="flex flex-wrap items-end gap-2 rounded-md border border-mimi-black/10 bg-white px-2 py-2">
                <input
                  className="min-w-[6rem] flex-1 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                  placeholder="Etiqueta (ej. 30 días)"
                  disabled={inputDisabled}
                  value={row.label}
                  onChange={(e) => updateRow(gi, ri, { label: e.target.value })}
                />
                <input
                  className="w-20 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                  type="number"
                  min={1}
                  placeholder="Días"
                  disabled={inputDisabled}
                  value={row.days}
                  onChange={(e) => updateRow(gi, ri, { days: e.target.value })}
                />
                <input
                  className="w-24 rounded border border-mimi-black/12 px-2 py-1.5 text-xs"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="S/."
                  disabled={inputDisabled}
                  value={row.price}
                  onChange={(e) => updateRow(gi, ri, { price: e.target.value })}
                />
                <button
                  type="button"
                  disabled={inputDisabled}
                  className="rounded-full border border-mimi-black/15 px-2 py-1 text-[11px] font-bold text-mimi-subtle hover:border-red-300 hover:text-red-800 disabled:opacity-50"
                  onClick={() => removeRow(gi, ri)}
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={inputDisabled}
              className="text-xs font-bold text-mimi-black underline decoration-mimi-black/25 underline-offset-2 hover:decoration-mimi-black disabled:opacity-50"
              onClick={() => addRow(gi)}
            >
              + Añadir plan al bloque
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={inputDisabled}
        className="text-xs font-bold text-mimi-black underline decoration-mimi-black/25 underline-offset-2 hover:decoration-mimi-black disabled:opacity-50"
        onClick={addGroup}
      >
        + Añadir bloque de precios (otro tipo)
      </button>
    </div>
  );
}
