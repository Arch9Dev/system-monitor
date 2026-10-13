import { useState } from "react";
import { api } from "../api";
import { eventLabel } from "../components/EventList";
import PageHeader from "../components/PageHeader";
import { dateTime } from "../format";
import { useHosts } from "../HostContext";
import { usePolling } from "../hooks";

export default function Events() {
  const { hosts } = useHosts();
  const [severity, setSeverity] = useState("");
  const [hostname, setHostname] = useState("");

  const { data } = usePolling(
    () => api.events({ limit: 200, severity: severity || undefined, hostname: hostname || undefined }),
    [severity, hostname],
    5000,
  );
  const events = data ?? [];

  return (
    <>
      <PageHeader title="Event Log" sub="Alerts, recoveries and host status changes">
        <select className="select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select className="select" value={hostname} onChange={(e) => setHostname(e.target.value)}>
          <option value="">All hosts</option>
          {hosts.map((h) => (
            <option key={h.hostname}>{h.hostname}</option>
          ))}
        </select>
      </PageHeader>

      <div className="card" style={{ ["--accent" as string]: "var(--indigo)", padding: 8 }}>
        {events.length === 0 ? (
          <div className="empty">No events match.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Time</th><th>Level</th><th>Host</th><th>Message</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="mono muted" style={{ whiteSpace: "nowrap" }}>{dateTime(e.created_at)}</td>
                  <td><span className={`sev ${eventLabel(e)}`}>{eventLabel(e)}</span></td>
                  <td className="mono">{e.hostname ?? "–"}</td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
