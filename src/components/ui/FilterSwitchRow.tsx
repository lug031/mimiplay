type Props = {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  variant?: "dark" | "light";
};

export function FilterSwitchRow({ icon, label, checked, onChange, variant = "dark" }: Props) {
  const trackOn = variant === "dark" ? "bg-white" : "bg-mimi-black";
  const trackOff = variant === "dark" ? "bg-white/15" : "bg-neutral-200";
  const knob = variant === "dark" ? "bg-mimi-black" : "bg-white";

  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm font-semibold text-white">
      <span className="flex items-center gap-2 text-white/80">
        {icon ? <span className="text-base opacity-90">{icon}</span> : null}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked ? trackOn : trackOff,
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-6 w-6 rounded-full shadow transition",
            knob,
            checked ? "left-5" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
