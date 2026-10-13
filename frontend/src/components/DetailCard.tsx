import type { CSSProperties, ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { HistoryPoint } from "../types";

interface Props {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  stats: { label: string; value: string }[];
  history: HistoryPoint[];
  dataKey: "cpu_percent" | "ram_percent" | "disk_percent";
  badge?: { text: string; ok: boolean };
}

/** Small card with four stat boxes and a sparkline, like the "services" cards in the reference. */
export default function DetailCard({ title, subtitle, icon, accent, stats, history, dataKey, badge }: Props) {
  const style = { "--accent": accent } as CSSProperties;
  return (
    <div className="card" style={style}>
      <div className="detail-title">
        <div className="icon-chip">{icon}</div>
        <div>
          <div className="panel-title">{title}</div>
          <div className="panel-sub">{subtitle}</div>
        </div>
        {badge && (
          <span className={`badge${badge.ok ? "" : " off"}`}>
            <span className={`dot ${badge.ok ? "online" : "offline"}`} />
            {badge.text}
          </span>
        )}
      </div>
      <div className="mini-grid">
        {stats.map((s) => (
          <div className="mini" key={s.label}>
            <span>{s.label}</span>
            <b>{s.value}</b>
          </div>
        ))}
      </div>
      <div className="sparkline">
        {history.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <YAxis hide domain={[0, 100]} />
              <Area type="monotone" dataKey={dataKey} stroke={accent} strokeWidth={1.6} fill={accent} fillOpacity={0.12} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
