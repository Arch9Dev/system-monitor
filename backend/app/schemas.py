from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field


def _as_utc(value: datetime) -> datetime:
    """SQLite returns naive datetimes; treat them as UTC so the frontend can parse them."""
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


UTCDatetime = Annotated[datetime, AfterValidator(_as_utc)]
Percent = Annotated[float, Field(ge=0, le=100)]

MetricName = Literal["cpu_percent", "ram_percent", "disk_percent"]
Severity = Literal["info", "warning", "critical"]


# ---------- metrics ----------
class MetricReport(BaseModel):
    """What the agent sends."""

    hostname: str = Field(min_length=1, max_length=255)
    cpu_percent: Percent
    ram_percent: Percent
    disk_percent: Percent
    uptime_seconds: int = Field(ge=0)
    cpu_cores: int | None = Field(default=None, ge=1)
    ram_total_bytes: int | None = Field(default=None, ge=0)
    ram_used_bytes: int | None = Field(default=None, ge=0)
    disk_total_bytes: int | None = Field(default=None, ge=0)
    disk_used_bytes: int | None = Field(default=None, ge=0)


class MetricOut(MetricReport):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recorded_at: UTCDatetime


class HistoryPoint(BaseModel):
    time: UTCDatetime
    cpu_percent: float
    ram_percent: float
    disk_percent: float


class HostOut(BaseModel):
    hostname: str
    online: bool
    last_seen: UTCDatetime
    uptime_seconds: int


# ---------- alert rules ----------
class AlertRuleBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    metric: MetricName
    operator: Literal[">", "<"] = ">"
    threshold: float = Field(ge=0, le=100)
    severity: Severity = "warning"
    hostname: str | None = None
    enabled: bool = True


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(BaseModel):
    """Every field optional so the UI can PATCH just what changed."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    metric: MetricName | None = None
    operator: Literal[">", "<"] | None = None
    threshold: float | None = Field(default=None, ge=0, le=100)
    severity: Severity | None = None
    hostname: str | None = None
    enabled: bool | None = None


class AlertRuleOut(AlertRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: UTCDatetime


# ---------- events ----------
class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: UTCDatetime
    category: str
    type: Literal["alert", "resolved"]
    severity: Severity
    hostname: str | None
    rule_id: int | None
    message: str
    value: float | None


class EventSummary(BaseModel):
    total: int
    info: int
    warning: int
    critical: int
