import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { EventSummary } from "../types";

const ROWS = [
  { key: "critical", label: "Critical", color: "#ef4444" },
  { key: "warning", label: "Warning", color: "#eab308" },
  { key: "info", label: "Info", color: "#3b82f6" },
] as const;

export default function SeverityDonut({ summary }: { summary: EventSummary | null }) {
  const total = summary?.total ?? 0;
  const data =
    total > 0
      ? ROWS.map((r) => ({ ...r, value: summary![r.key] }))
      : [{ key: "none", label: "None", color: "#22c55e", value: 1 }];

  return (
    <>
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={62} outerRadius={80} paddingAngle={total > 0 ? 3 : 0} stroke="none" startAngle={90} endAngle={-270}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <b>{total}</b>
          <span>{total === 0 ? "all clear" : "alerts"}</span>
        </div>
      </div>
      <div className="legend-list">
        {ROWS.map((r) => {
          const count = summary?.[r.key] ?? 0;
          return (
            <div className="legend-row" key={r.key}>
              <i style={{ background: r.color }} />
              {r.label}
              <span className="pct">{total ? Math.round((count / total) * 100) : 0}%</span>
              <span className="cnt">{count}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
