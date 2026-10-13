import { Plus, Trash2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { api } from "../api";
import PageHeader from "../components/PageHeader";
import { METRIC_LABEL } from "../format";
import { useHosts } from "../HostContext";
import { usePolling } from "../hooks";
import type { MetricName, NewAlertRule, Severity } from "../types";

const SEV_COLOR: Record<Severity, string> = { critical: "var(--red)", warning: "var(--yellow)", info: "var(--blue)" };

const EXAMPLES: NewAlertRule[] = [
  { name: "High CPU", metric: "cpu_percent", operator: ">", threshold: 90, severity: "critical", hostname: null, enabled: true },
  { name: "High memory", metric: "ram_percent", operator: ">", threshold: 85, severity: "warning", hostname: null, enabled: true },
  { name: "Disk almost full", metric: "disk_percent", operator: ">", threshold: 90, severity: "critical", hostname: null, enabled: true },
];

const blank: NewAlertRule = { name: "", metric: "cpu_percent", operator: ">", threshold: 80, severity: "warning", hostname: null, enabled: true };

export default function Alerts() {
  const { hosts } = useHosts();
  const rules = usePolling(api.rules, [], 10000);
  const [form, setForm] = useState<NewAlertRule>(blank);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    try {
      setError(null);
      await action();
      await rules.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    run(async () => {
      await api.createRule({ ...form, name: form.name.trim() });
      setForm(blank);
    });
  };

  const list = rules.data ?? [];

  return (
    <>
      <PageHeader title="Alert Rules" sub="Get an event in the log when a metric crosses a threshold" />
      {error && <div className="banner">{error}</div>}

      <form className="card" style={{ ["--accent" as string]: "var(--indigo)" }} onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>NAME</label>
            <input className="input" placeholder="e.g. High CPU" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>METRIC</label>
            <select className="select" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value as MetricName })}>
              {Object.entries(METRIC_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>WHEN</label>
            <select className="select" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value as ">" | "<" })}>
              <option value=">">above</option>
              <option value="<">below</option>
            </select>
          </div>
          <div className="field">
            <label>THRESHOLD %</label>
            <input className="input" type="number" min={0} max={100} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>SEVERITY</label>
            <select className="select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="field">
            <label>HOST</label>
            <select className="select" value={form.hostname ?? ""} onChange={(e) => setForm({ ...form, hostname: e.target.value || null })}>
              <option value="">All hosts</option>
              {hosts.map((h) => (
                <option key={h.hostname}>{h.hostname}</option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit">
            <Plus size={15} /> Add
          </button>
        </div>
      </form>

      {list.length === 0 && !rules.loading ? (
        <div className="card empty" style={{ marginTop: 16 }}>
          <h3>No alert rules yet</h3>
          Start with a few sensible defaults, or create your own above.
          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={() => run(async () => { for (const r of EXAMPLES) await api.createRule(r); })}>
              Add example rules
            </button>
          </div>
        </div>
      ) : (
        <div className="rule-list">
          {list.map((r) => (
            <div className="card rule" key={r.id} style={{ ["--accent" as string]: SEV_COLOR[r.severity], opacity: r.enabled ? 1 : 0.55 } as CSSProperties}>
              <span className={`sev ${r.severity}`}>{r.severity}</span>
              <div className="rule-info">
                <b>{r.name}</b>
                <div>
                  {METRIC_LABEL[r.metric]} {r.operator === ">" ? "above" : "below"} {r.threshold}% · {r.hostname ?? "all hosts"}
                </div>
              </div>
              <button className={`switch${r.enabled ? " on" : ""}`} title={r.enabled ? "Disable" : "Enable"} onClick={() => run(() => api.updateRule(r.id, { enabled: !r.enabled }))} />
              <button className="btn danger" title="Delete rule" onClick={() => run(() => api.deleteRule(r.id))}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
