import { Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { formatUptime, timeAgo } from "../format";
import { useHosts } from "../HostContext";

export default function Hosts() {
  const { hosts, select } = useHosts();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Hosts" sub="Machines that have reported metrics" />
      {hosts.length === 0 ? (
        <div className="card empty">
          <h3>No hosts yet</h3>
          Run the agent on a machine and it will appear here.
        </div>
      ) : (
        <div className="grid details">
          {hosts.map((h) => (
            <div className="card" key={h.hostname} style={{ ["--accent" as string]: h.online ? "var(--green)" : "var(--red)" }}>
              <div className="detail-title">
                <div className="icon-chip">
                  <Server size={16} />
                </div>
                <div className="panel-title">{h.hostname}</div>
                <span className={`badge${h.online ? "" : " off"}`}>{h.online ? "Online" : "Offline"}</span>
              </div>
              <div className="mini-grid">
                <div className="mini"><span>Uptime</span><b>{formatUptime(h.uptime_seconds)}</b></div>
                <div className="mini"><span>Last seen</span><b>{timeAgo(h.last_seen)}</b></div>
              </div>
              <button className="btn ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => { select(h.hostname); navigate("/"); }}>
                View dashboard
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
