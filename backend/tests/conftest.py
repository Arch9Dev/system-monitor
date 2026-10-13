import os

# Must be set before the app is imported so settings pick it up.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["API_KEY"] = "test-key"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

HEADERS = {"X-API-Key": "test-key"}


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with Session() as session:
        yield session


@pytest.fixture()
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)  # no `with` -> startup tasks don't run in tests
    app.dependency_overrides.clear()


def make_report(**overrides):
    report = {
        "hostname": "test-pc",
        "cpu_percent": 10.0,
        "ram_percent": 40.0,
        "disk_percent": 50.0,
        "uptime_seconds": 1000,
        "cpu_cores": 8,
        "ram_total_bytes": 16_000_000_000,
        "ram_used_bytes": 6_400_000_000,
        "disk_total_bytes": 500_000_000_000,
        "disk_used_bytes": 250_000_000_000,
    }
    report.update(overrides)
    return report
