from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Event, Metric, utcnow
from app.schemas import HostOut


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def list_hosts(db: Session) -> list[HostOut]:
    """Every host that has ever reported, with its most recent report."""
    latest = select(Metric.hostname, func.max(Metric.recorded_at).label("last")).group_by(Metric.hostname).subquery()
    rows = db.execute(
        select(Metric).join(latest, (Metric.hostname == latest.c.hostname) & (Metric.recorded_at == latest.c.last))
    ).scalars()

    cutoff = utcnow() - timedelta(seconds=settings.offline_after_seconds)
    hosts = {}
    for m in rows:
        seen = as_utc(m.recorded_at)
        hosts[m.hostname] = HostOut(
            hostname=m.hostname, online=seen >= cutoff, last_seen=seen, uptime_seconds=m.uptime_seconds
        )
    return sorted(hosts.values(), key=lambda h: h.hostname)


def sync_host_status(db: Session, hostname: str, online: bool) -> None:
    """Log a host-status event only when the status actually changes."""
    last = db.scalar(
        select(Event)
        .where(Event.category == "host", Event.hostname == hostname)
        .order_by(Event.id.desc())
        .limit(1)
    )
    recorded_offline = last is not None and last.type == "alert"

    if not online and not recorded_offline:
        db.add(Event(category="host", type="alert", severity="critical", hostname=hostname,
                     message=f"{hostname} stopped reporting"))
    elif online and recorded_offline:
        db.add(Event(category="host", type="resolved", severity="info", hostname=hostname,
                     message=f"{hostname} is reporting again"))


def check_offline_hosts(db: Session) -> None:
    for host in list_hosts(db):
        sync_host_status(db, host.hostname, host.online)
    db.commit()


def purge_old_metrics(db: Session) -> int:
    cutoff = utcnow() - timedelta(days=settings.retention_days)
    result = db.execute(delete(Metric).where(Metric.recorded_at < cutoff))
    db.commit()
    return result.rowcount or 0
