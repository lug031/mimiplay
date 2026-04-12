type Item = { key: string; label: string };

type Props = {
  items: Item[];
  value: string;
  onChange: (key: string) => void;
  /** Estilo “activo” alineado a marca */
  variant?: "dark" | "light";
};

export function FilterPills({ items, value, onChange, variant = "dark" }: Props) {
  const active =
    variant === "dark"
      ? "bg-white text-mimi-black shadow-sm"
      : "bg-mimi-black text-white shadow-sm";
  const idle =
    variant === "dark"
      ? "border border-white/20 bg-mimi-void text-white/90 hover:border-white/35"
      : "border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400";

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={[
            "max-w-[220px] truncate rounded-full px-3 py-1.5 text-xs font-bold transition",
            value === item.key ? active : idle,
          ].join(" ")}
          title={item.label}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
