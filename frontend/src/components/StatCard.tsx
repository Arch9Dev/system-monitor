import type { CSSProperties, ReactNode } from "react";

interface Props {
  label: string;
  icon: ReactNode;
  accent: string;
  value: string;
  unit?: string;
  percent?: number | null;
  caption: string;
}

/** Bars turn amber/red as usage climbs, whatever the card's accent colour is. */
function barColor(percent: number, accent: string) {
  if (percent >= 90) return "var(--red)";
  if (percent >= 75) return "var(--yellow)";
  return accent;
}

export default function StatCard({ label, icon, accent, value, unit, percent, caption }: Props) {
  const style = { "--accent": accent } as CSSProperties;
  return (
    <div className="card" style={style}>
      <div className="card-head">
        {label}
        {icon}
      </div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {percent != null && (
        <div className="bar">
          <span style={{ width: `${Math.min(100, percent)}%`, background: barColor(percent, accent) }} />
        </div>
      )}
      <div className="stat-caption">{caption}</div>
    </div>
  );
}
