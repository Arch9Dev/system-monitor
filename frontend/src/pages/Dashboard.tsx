import { Clock, Cpu, HardDrive, ListChecks, MemoryStick, RefreshCw } from "lucide-react";
import { useState } from "react";
import { api } from "../api";
import DetailCard from "../components/DetailCard";
import EventList from "../components/EventList";
import PageHeader from "../components/PageHeader";
import SeverityDonut from "../components/SeverityDonut";
import StatCard from "../components/StatCard";
import UsageChart, { Legend } from "../components/UsageChart";
import { bytesText, formatBytes, formatUptime, timeAgo } from "../format";
import { useHosts } from "../HostContext";
import { usePolling } from "../hooks";
import type { HistoryPoint } from "../types";

const RANGES = [
  { label: "Last 15 minutes", minutes: 15 },
  { label: "Last hour", minutes: 60 },
  { label: "Last 6 hours", minutes: 360 },
  { label: "Last 24 hours", minutes: 1440 },
  { label: "Last 7 days", minutes: 10080 },
];

const peak = (h: HistoryPoint[], k: keyof Omit<HistoryPoint, "time">) =>
  h.length ? `${Math.max(...h.map((p) => p[k])).toFixed(0)}%` : "–";
const avg = (h: HistoryPoint[], k: keyof Omit<HistoryPoint, "time">) =>
  h.length ? `${(h.reduce((s, p) => s + p[k], 0) / h.length).toFixed(0)}%` : "–";

export default function Dashboard() {
  const { hosts, selected, select } = useHosts();
  const [minutes, setMinutes] = useState(60);
  const [spinning, setSpinning] = useState(false);

  const latest = usePolling(() => (selected ? api.latest(selected) : Promise.resolve(null)), [selected], 5000);
  const history = usePolling(() => (selected ? api.history(selected, minutes) : Promise.resolve([])), [selected, minutes], 10000);
  const summary = usePolling(() => api.eventSummary(24), [], 10000);
  const events = usePolling(() => api.events({ limit: 6, hostname: selected ?? undefined }), [selected], 10000);

  const refreshAll = async () => {
    setSpinning(true);
    await Promise.all([latest.refresh(), history.refresh(), summary.refresh(), events.refresh()]);
    setTimeout(() => setSpinning(false), 600);
  };

  const host = hosts.find((h) => h.hostname === selected);
  const m = latest.data;
  const hist = history.data ?? [];

  if (!selected || !host) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="card empty">
          <h3>Waiting for the monitoring agent…</h3>
          Start it on the machine you want to monitor:
          <br />
          <code>python agent.py</code>
        </div>
      </>
    );
  }

  const ram = formatBytes(m?.ram_used_bytes);
  const disk = formatBytes(m?.disk_used_bytes);

  return (
    <>
      <PageHeader
        title="Dashboard"
        sub={
          <>
            {hosts.length > 1 ? (
              <select className="select" value={selected} onChange={(e) => select(e.target.value)} style={{ padding: "3px 8px" }}>
                {hosts.map((h) => (
                  <option key={h.hostname}>{h.hostname}</option>
                ))}
              </select>
            ) : (
              <span>{selected}</span>
            )}
            ·<span className={`dot ${host.online ? "online" : "offline"}`} />
            <span style={{ color: host.online ? "var(--green)" : "var(--red)" }}>{host.online ? "online" : "offline"}</span>
          </>
        }
      >
        <select className="select" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
          {RANGES.map((r) => (
            <option key={r.minutes} value={r.minutes}>
              {r.label}
            </option>
          ))}
        </select>
        <button className="btn" onClick={refreshAll}>
          <RefreshCw size={15} className={spinning ? "spin" : ""} /> Refresh
        </button>
      </PageHeader>

      <div className="grid stats">
        <StatCard label="CPU usage" icon={<Cpu size={16} />} accent="var(--cyan)" value={m ? m.cpu_percent.toFixed(0) : "–"} unit="%" percent={m?.cpu_percent} caption={m?.cpu_cores ? `${m.cpu_cores} logical cores` : "–"} />
        <StatCard label="Memory" icon={<MemoryStick size={16} />} accent="var(--purple)" value={ram.value} unit={ram.unit} percent={m?.ram_percent} caption={m ? `${bytesText(m.ram_used_bytes)} / ${bytesText(m.ram_total_bytes)} · ${m.ram_percent.toFixed(0)}%` : "–"} />
        <StatCard label="Disk usage" icon={<HardDrive size={16} />} accent="var(--orange)" value={disk.value} unit={disk.unit} percent={m?.disk_percent} caption={m ? `${bytesText(m.disk_used_bytes)} / ${bytesText(m.disk_total_bytes)} · ${m.disk_percent.toFixed(0)}%` : "–"} />
        <StatCard label="Uptime" icon={<Clock size={16} />} accent="var(--green)" value={m ? formatUptime(m.uptime_seconds) : "–"} caption={m ? `last report ${timeAgo(m.recorded_at)}` : "–"} />
      </div>

      <div className="grid charts">
        <div className="card" style={{ ["--accent" as string]: "var(--cyan)" }}>
          <div className="panel-top">
            <div>
              <div className="panel-title">Resource usage</div>
              <div className="panel-sub">CPU, memory &amp; disk · {RANGES.find((r) => r.minutes === minutes)?.label.toLowerCase()}</div>
            </div>
            <Legend />
          </div>
          <UsageChart data={hist} minutes={minutes} />
        </div>

        <div className="card" style={{ ["--accent" as string]: "var(--red)" }}>
          <div className="panel-title">Alert distribution</div>
          <div className="panel-sub" style={{ marginBottom: 10 }}>By severity · last 24h</div>
          <SeverityDonut summary={summary.data} />
        </div>
      </div>

      <div className="section-title">
        <ListChecks size={18} /> System details
      </div>
      <div className="grid details">
        <DetailCard
          title="Processor" subtitle={m?.cpu_cores ? `${m.cpu_cores} logical cores` : "CPU"} icon={<Cpu size={16} />} accent="#22d3ee" dataKey="cpu_percent" history={hist}
          badge={{ text: host.online ? "Active" : "Offline", ok: host.online }}
          stats={[{ label: "Current", value: m ? `${m.cpu_percent.toFixed(0)}%` : "–" }, { label: "Cores", value: String(m?.cpu_cores ?? "–") }, { label: "Peak", value: peak(hist, "cpu_percent") }, { label: "Average", value: avg(hist, "cpu_percent") }]}
        />
        <DetailCard
          title="Memory" subtitle={bytesText(m?.ram_total_bytes)} icon={<MemoryStick size={16} />} accent="#a855f7" dataKey="ram_percent" history={hist}
          badge={{ text: host.online ? "Active" : "Offline", ok: host.online }}
          stats={[{ label: "Used", value: bytesText(m?.ram_used_bytes) }, { label: "Free", value: m?.ram_total_bytes != null && m.ram_used_bytes != null ? bytesText(m.ram_total_bytes - m.ram_used_bytes) : "–" }, { label: "Peak", value: peak(hist, "ram_percent") }, { label: "Average", value: avg(hist, "ram_percent") }]}
        />
        <DetailCard
          title="Storage" subtitle={bytesText(m?.disk_total_bytes)} icon={<HardDrive size={16} />} accent="#f97316" dataKey="disk_percent" history={hist}
          badge={{ text: host.online ? "Active" : "Offline", ok: host.online }}
          stats={[{ label: "Used", value: bytesText(m?.disk_used_bytes) }, { label: "Free", value: m?.disk_total_bytes != null && m.disk_used_bytes != null ? bytesText(m.disk_total_bytes - m.disk_used_bytes) : "–" }, { label: "Peak", value: peak(hist, "disk_percent") }, { label: "Average", value: avg(hist, "disk_percent") }]}
        />
        <DetailCard
          title="Host" subtitle={selected} icon={<Clock size={16} />} accent="#22c55e" dataKey="cpu_percent" history={[]}
          badge={{ text: host.online ? "Online" : "Offline", ok: host.online }}
          stats={[{ label: "Uptime", value: m ? formatUptime(m.uptime_seconds) : "–" }, { label: "Last seen", value: timeAgo(host.last_seen) }, { label: "Samples", value: String(hist.length) }, { label: "Status", value: host.online ? "Reporting" : "Silent" }]}
        />
      </div>

      <div className="section-title">
        <ListChecks size={18} /> Recent events
      </div>
      <div className="card" style={{ ["--accent" as string]: "var(--indigo)" }}>
        <EventList events={events.data ?? []} />
      </div>
    </>
  );
}
