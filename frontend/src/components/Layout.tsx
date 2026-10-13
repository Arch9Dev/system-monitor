import { Activity, Bell, LayoutDashboard, ScrollText, Server } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useHosts } from "../HostContext";

const NAV: { section: string; items: { to: string; label: string; icon: ReactNode }[] }[] = [
  {
    section: "OVERVIEW",
    items: [
      { to: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { to: "/hosts", label: "Hosts", icon: <Server size={16} /> },
    ],
  },
  {
    section: "MONITORING",
    items: [
      { to: "/alerts", label: "Alert Rules", icon: <Bell size={16} /> },
      { to: "/events", label: "Event Log", icon: <ScrollText size={16} /> },
    ],
  },
];

export default function Layout() {
  const { hosts, apiError } = useHosts();
  const online = hosts.filter((h) => h.online).length;
  const pct = hosts.length ? Math.round((online / hosts.length) * 100) : 0;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Activity size={16} />
          </div>
          <span className="brand-name">PulseOps</span>
          <span className="brand-ver">v1.0</span>
        </div>

        {NAV.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-spacer" />
        <div className="health-box">
          <div className="health-label">
            <span className="dot online" /> HOST HEALTH
          </div>
          <div className="health-value">{pct}%</div>
          <div className="health-sub">
            {online} of {hosts.length} host{hosts.length === 1 ? "" : "s"} online
          </div>
        </div>
      </aside>

      <main className="main">
        {apiError && <div className="banner">Can't reach the backend ({apiError}). Is it running on port 8000?</div>}
        <Outlet />
      </main>
    </div>
  );
}
