import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { clockTime, dateTime } from "../format";
import type { HistoryPoint } from "../types";

const SERIES = [
  { key: "cpu_percent", name: "CPU", color: "#22d3ee" },
  { key: "ram_percent", name: "Memory", color: "#a855f7" },
  { key: "disk_percent", name: "Disk", color: "#f97316" },
] as const;

export function Legend() {
  return (
    <div className="legend">
      {SERIES.map((s) => (
        <span key={s.key}>
          <i style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export default function UsageChart({ data, minutes }: { data: HistoryPoint[]; minutes: number }) {
  if (data.length < 2) {
    return (
      <div className="chart-box empty" style={{ display: "grid", placeContent: "center" }}>
        Collecting data… charts appear after a few reports.
      </div>
    );
  }
  const fmt = minutes > 1440 ? dateTime : clockTime;

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#1b1b28" vertical={false} />
          <XAxis dataKey="time" tickFormatter={fmt} stroke="#4d4d63" tick={{ fontSize: 11 }} minTickGap={50} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} stroke="#4d4d63" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(t) => dateTime(String(t))}
            formatter={(v) => `${v}%`}
          />
          {SERIES.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={s.key === "disk_percent" ? "none" : `url(#g-${s.key})`} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
