import { timeAgo } from "../format";
import type { EventItem } from "../types";

export function eventLabel(e: EventItem) {
  return e.type === "resolved" ? "resolved" : e.severity;
}

export default function EventList({ events }: { events: EventItem[] }) {
  if (events.length === 0) return <div className="empty">No events yet. Alerts and host status changes show up here.</div>;
  return (
    <div>
      {events.map((e) => (
        <div className="event-row" key={e.id}>
          <span className={`sev ${eventLabel(e)}`}>{eventLabel(e)}</span>
          <div className="event-msg">
            {e.message}
            {e.hostname && <small>{e.hostname}</small>}
          </div>
          <span className="event-time">{timeAgo(e.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
