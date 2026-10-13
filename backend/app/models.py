from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Metric(Base):
    """One snapshot of a machine's health, sent by the agent."""

    __tablename__ = "metrics"
    __table_args__ = (Index("ix_metrics_host_time", "hostname", "recorded_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    hostname: Mapped[str] = mapped_column(String(255))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    cpu_percent: Mapped[float] = mapped_column(Float)
    ram_percent: Mapped[float] = mapped_column(Float)
    disk_percent: Mapped[float] = mapped_column(Float)
    uptime_seconds: Mapped[int] = mapped_column(BigInteger)
    cpu_cores: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ram_total_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    ram_used_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    disk_total_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    disk_used_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class AlertRule(Base):
    """'Tell me when <metric> <operator> <threshold>' (optionally for one host)."""

    __tablename__ = "alert_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    metric: Mapped[str] = mapped_column(String(32))  # cpu_percent | ram_percent | disk_percent
    operator: Mapped[str] = mapped_column(String(2))  # ">" or "<"
    threshold: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(16), default="warning")  # info | warning | critical
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)  # None = all hosts
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Event(Base):
    """The event log: alerts firing, alerts resolving, hosts going offline/online."""

    __tablename__ = "events"
    __table_args__ = (Index("ix_events_rule_host", "rule_id", "hostname"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    category: Mapped[str] = mapped_column(String(16))  # "rule" or "host"
    type: Mapped[str] = mapped_column(String(16))  # "alert" or "resolved"
    severity: Mapped[str] = mapped_column(String(16))
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rule_id: Mapped[int | None] = mapped_column(ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    message: Mapped[str] = mapped_column(String(500))
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
