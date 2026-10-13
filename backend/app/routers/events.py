from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, utcnow
from app.schemas import EventOut, EventSummary

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    limit: int = Query(50, ge=1, le=500),
    severity: str | None = None,
    hostname: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Event).order_by(Event.id.desc()).limit(limit)
    if severity:
        query = query.where(Event.severity == severity)
    if hostname:
        query = query.where(Event.hostname == hostname)
    return db.scalars(query).all()


@router.get("/summary", response_model=EventSummary)
def event_summary(hours: int = Query(24, ge=1, le=24 * 7), db: Session = Depends(get_db)):
    """How many alerts fired per severity in the window (for the dashboard donut)."""
    since = utcnow() - timedelta(hours=hours)
    rows = db.execute(
        select(Event.severity, func.count())
        .where(Event.type == "alert", Event.created_at >= since)
        .group_by(Event.severity)
    ).all()
    counts = {severity: count for severity, count in rows}
    return EventSummary(
        total=sum(counts.values()),
        info=counts.get("info", 0),
        warning=counts.get("warning", 0),
        critical=counts.get("critical", 0),
    )
