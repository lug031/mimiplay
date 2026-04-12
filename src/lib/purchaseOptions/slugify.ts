/** Id estable a partir de etiqueta visible (opciones de compra). */
export function slugifyTierId(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || `opcion-${index + 1}`;
}

/** Id estable para un grupo (título del bloque). */
export function slugifyGroupId(title: string, index: number): string {
  const t = title.trim();
  if (!t) return `grupo-${index + 1}`;
  return slugifyTierId(t, index).slice(0, 48) || `grupo-${index + 1}`;
}

/** Id único por posición + etiqueta (evita colisiones si hay dos bloques con el mismo título). */
export function stableGroupId(groupIndex: number, title: string): string {
  const base = slugifyTierId(title.trim() || "grupo", groupIndex);
  return `${base}-g${groupIndex}`.slice(0, 64);
}

/** Id único por grupo, fila y etiqueta. */
export function stableTierId(groupIndex: number, rowIndex: number, label: string): string {
  const base = slugifyTierId(label.trim() || "plan", rowIndex);
  return `${base}-g${groupIndex}-r${rowIndex}`.slice(0, 64);
}
