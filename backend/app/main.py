import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import alerts, events, hosts, metrics
from app.services.hosts import check_offline_hosts, purge_old_metrics

logger = logging.getLogger("monitor")


def _housekeeping_tick(tick: int) -> None:
    with SessionLocal() as db:
        check_offline_hosts(db)
        if tick % 240 == 0:  # roughly hourly
            purge_old_metrics(db)


async def _housekeeping_loop() -> None:
    """Every 15s: notice hosts that went silent. Hourly: delete old metrics."""
    tick = 0
    while True:
        try:
            await asyncio.to_thread(_housekeeping_tick, tick)
        except Exception:  # never let the loop die
            logger.exception("housekeeping failed")
        tick += 1
        await asyncio.sleep(15)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # creates tables on first run
    task = asyncio.create_task(_housekeeping_loop())
    yield
    task.cancel()


app = FastAPI(title="System Monitor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(hosts.router)
app.include_router(alerts.router)
app.include_router(events.router)


@app.get("/health")
def health():
    return {"status": "ok"}
