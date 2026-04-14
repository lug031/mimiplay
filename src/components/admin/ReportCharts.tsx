import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BarDatum = { name: string; value: number };

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.08)",
  fontSize: 12,
};

export function ReportBarChart({ data, title }: { data: BarDatum[]; title: string }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-mimi-black">{title}</h3>
        <p className="mt-8 text-center text-sm text-mimi-muted">Sin datos para este gráfico.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-extrabold text-mimi-black">{title}</h3>
      <div className="mt-4 h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 56 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#737373" }}
              interval={0}
              angle={-22}
              textAnchor="end"
              height={54}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#737373" }} width={36} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value ?? 0}`, "Pedidos"]} />
            <Bar dataKey="value" fill="#000000" radius={[6, 6, 0, 0]} name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type LineDatum = { label: string; value: number };

export function ReportLineChart({ data, title }: { data: LineDatum[]; title: string }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-mimi-black">{title}</h3>
        <p className="mt-8 text-center text-sm text-mimi-muted">Sin datos para este periodo.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-extrabold text-mimi-black">{title}</h3>
      <div className="mt-4 h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#737373" }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#737373" }} width={36} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value ?? 0}`, "Pedidos"]} />
            <Line type="monotone" dataKey="value" stroke="#008ba3" strokeWidth={2} dot={{ r: 3, fill: "#008ba3" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type PieDatum = { name: string; value: number; color: string };

export function ReportPieChart({ data, title, valueLabel }: { data: PieDatum[]; title: string; valueLabel: string }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-mimi-black">{title}</h3>
        <p className="mt-8 text-center text-sm text-mimi-muted">Sin datos para este gráfico.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-mimi-black/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-extrabold text-mimi-black">{title}</h3>
      <div className="mt-4 h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              paddingAngle={1}
              label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, _name, item) => {
                const name = (item?.payload as PieDatum | undefined)?.name ?? "";
                return [`${value ?? 0}`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[10px] text-mimi-muted">{valueLabel}</p>
    </div>
  );
}
