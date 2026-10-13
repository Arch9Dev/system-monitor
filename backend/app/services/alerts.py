from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import AlertRule, Event, Metric

METRIC_LABELS = {"cpu_percent": "CPU", "ram_percent": "RAM", "disk_percent": "Disk"}


def is_breached(value: float, operator: str, threshold: float) -> bool:
    return value > threshold if operator == ">" else value < threshold


def _last_event(db: Session, *conditions) -> Event | None:
    return db.scalar(select(Event).where(*conditions).order_by(Event.id.desc()).limit(1))


def evaluate_rules(db: Session, metric: Metric) -> None:
    """Check every enabled rule against a fresh metric.

    An alert event is logged only when a rule *starts* breaching, and a
    'resolved' event only when it stops, so a long spike is one entry, not hundreds.
    """
    rules = db.scalars(
        select(AlertRule).where(
            AlertRule.enabled.is_(True),
            or_(AlertRule.hostname.is_(None), AlertRule.hostname == metric.hostname),
        )
    ).all()

    for rule in rules:
        value = getattr(metric, rule.metric)
        breached = is_breached(value, rule.operator, rule.threshold)
        last = _last_event(
            db, Event.category == "rule", Event.rule_id == rule.id, Event.hostname == metric.hostname
        )
        firing = last is not None and last.type == "alert"
        label = METRIC_LABELS[rule.metric]

        if breached and not firing:
            db.add(
                Event(
                    category="rule", type="alert", severity=rule.severity, hostname=metric.hostname,
                    rule_id=rule.id, value=value,
                    message=f"{rule.name}: {label} is {value:.1f}% ({rule.operator} {rule.threshold:g}%)",
                )
            )
        elif not breached and firing:
            db.add(
                Event(
                    category="rule", type="resolved", severity="info", hostname=metric.hostname,
                    rule_id=rule.id, value=value,
                    message=f"{rule.name}: {label} back to normal at {value:.1f}%",
                )
            )
