from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Metric, utcnow
from app.schemas import HistoryPoint, MetricOut, MetricReport
from app.security import require_api_key
from app.services.alerts import evaluate_rules
from app.services.hosts import as_utc, sync_host_status

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_api_key)])
def ingest_metric(report: MetricReport, db: Session = Depends(get_db)):
    """Called by the monitoring agent every few seconds."""
    metric = Metric(**report.model_dump())
    db.add(metric)
    db.flush()  # assigns metric.id without committing yet
    sync_host_status(db, metric.hostname, online=True)
    evaluate_rules(db, metric)
    db.commit()
    return {"id": metric.id}


@router.get("/latest", response_model=MetricOut)
def latest_metric(hostname: str, db: Session = Depends(get_db)):
    metric = db.scalar(
        select(Metric).where(Metric.hostname == hostname).order_by(Metric.recorded_at.desc()).limit(1)
    )
    if metric is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No data for host '{hostname}'")
    return metric


@router.get("/history", response_model=list[HistoryPoint])
def metric_history(
    hostname: str,
    minutes: int = Query(60, ge=1, le=7 * 24 * 60),
    points: int = Query(120, ge=10, le=500),
    db: Session = Depends(get_db),
):
    """Time series for charts, averaged into at most `points` buckets."""
    since = utcnow() - timedelta(minutes=minutes)
    rows = db.execute(
        select(Metric.recorded_at, Metric.cpu_percent, Metric.ram_percent, Metric.disk_percent)
        .where(Metric.hostname == hostname, Metric.recorded_at >= since)
        .order_by(Metric.recorded_at)
    ).all()

    bucket_seconds = max(minutes * 60 / points, 1)
    buckets: dict[int, list] = defaultdict(list)
    for row in rows:
        buckets[int(as_utc(row.recorded_at).timestamp() // bucket_seconds)].append(row)

    result = []
    for key in sorted(buckets):
        group = buckets[key]
        n = len(group)
        result.append(
            HistoryPoint(
                time=as_utc(group[-1].recorded_at),
                cpu_percent=round(sum(r.cpu_percent for r in group) / n, 1),
                ram_percent=round(sum(r.ram_percent for r in group) / n, 1),
                disk_percent=round(sum(r.disk_percent for r in group) / n, 1),
            )
        )
    return result
