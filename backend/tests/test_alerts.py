from datetime import timedelta

from app.models import Metric, utcnow
from app.services.hosts import check_offline_hosts
from tests.conftest import HEADERS, make_report

RULE = {"name": "High CPU", "metric": "cpu_percent", "operator": ">", "threshold": 80, "severity": "critical"}


def test_rule_crud(client):
    created = client.post("/api/alert-rules", json=RULE)
    assert created.status_code == 201
    rule_id = created.json()["id"]

    assert len(client.get("/api/alert-rules").json()) == 1

    patched = client.patch(f"/api/alert-rules/{rule_id}", json={"threshold": 90, "enabled": False})
    assert patched.json()["threshold"] == 90
    assert patched.json()["enabled"] is False

    assert client.delete(f"/api/alert-rules/{rule_id}").status_code == 204
    assert client.get("/api/alert-rules").json() == []
    assert client.delete(f"/api/alert-rules/{rule_id}").status_code == 404


def test_rule_validation(client):
    assert client.post("/api/alert-rules", json={**RULE, "metric": "gpu"}).status_code == 422
    assert client.post("/api/alert-rules", json={**RULE, "threshold": 500}).status_code == 422


def test_alert_fires_once_then_resolves(client):
    client.post("/api/alert-rules", json=RULE)

    for cpu in (95, 96, 97):  # three breaching reports -> ONE alert
        client.post("/api/metrics", json=make_report(cpu_percent=cpu), headers=HEADERS)
    events = client.get("/api/events").json()
    assert [e["type"] for e in events] == ["alert"]
    assert events[0]["severity"] == "critical"

    client.post("/api/metrics", json=make_report(cpu_percent=20), headers=HEADERS)
    events = client.get("/api/events").json()
    assert [e["type"] for e in events] == ["resolved", "alert"]


def test_disabled_rule_does_not_fire(client):
    client.post("/api/alert-rules", json={**RULE, "enabled": False})
    client.post("/api/metrics", json=make_report(cpu_percent=99), headers=HEADERS)
    assert client.get("/api/events").json() == []


def test_rule_scoped_to_other_host_does_not_fire(client):
    client.post("/api/alert-rules", json={**RULE, "hostname": "other-pc"})
    client.post("/api/metrics", json=make_report(cpu_percent=99), headers=HEADERS)
    assert client.get("/api/events").json() == []


def test_less_than_operator(client):
    client.post("/api/alert-rules", json={**RULE, "name": "Low disk headroom", "metric": "disk_percent",
                                          "operator": "<", "threshold": 10})
    client.post("/api/metrics", json=make_report(disk_percent=5), headers=HEADERS)
    assert len(client.get("/api/events").json()) == 1


def test_event_summary_counts_alerts_by_severity(client):
    client.post("/api/alert-rules", json=RULE)
    client.post("/api/metrics", json=make_report(cpu_percent=99), headers=HEADERS)
    summary = client.get("/api/events/summary").json()
    assert summary == {"total": 1, "info": 0, "warning": 0, "critical": 1}


def test_host_goes_offline_and_comes_back(client, db_session):
    client.post("/api/metrics", json=make_report(), headers=HEADERS)
    db_session.query(Metric).update({"recorded_at": utcnow() - timedelta(minutes=5)})
    db_session.commit()

    check_offline_hosts(db_session)
    check_offline_hosts(db_session)  # second run must not duplicate the event
    events = client.get("/api/events").json()
    assert [e["message"] for e in events] == ["test-pc stopped reporting"]
    assert client.get("/api/hosts").json()[0]["online"] is False

    client.post("/api/metrics", json=make_report(), headers=HEADERS)
    events = client.get("/api/events").json()
    assert events[0]["message"] == "test-pc is reporting again"
