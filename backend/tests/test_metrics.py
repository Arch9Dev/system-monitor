from tests.conftest import HEADERS, make_report


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_ingest_requires_api_key(client):
    assert client.post("/api/metrics", json=make_report()).status_code == 401
    assert client.post("/api/metrics", json=make_report(), headers={"X-API-Key": "nope"}).status_code == 401


def test_ingest_rejects_bad_data(client):
    r = client.post("/api/metrics", json=make_report(cpu_percent=150), headers=HEADERS)
    assert r.status_code == 422
    r = client.post("/api/metrics", json=make_report(cpu_percent="abc"), headers=HEADERS)
    assert r.status_code == 422


def test_ingest_then_latest(client):
    assert client.post("/api/metrics", json=make_report(cpu_percent=23.5), headers=HEADERS).status_code == 201
    r = client.get("/api/metrics/latest", params={"hostname": "test-pc"})
    assert r.status_code == 200
    assert r.json()["cpu_percent"] == 23.5
    assert r.json()["recorded_at"].endswith("Z") or "+00:00" in r.json()["recorded_at"]


def test_latest_unknown_host_is_404(client):
    assert client.get("/api/metrics/latest", params={"hostname": "ghost"}).status_code == 404


def test_history_returns_points(client):
    for cpu in (10, 20, 30):
        client.post("/api/metrics", json=make_report(cpu_percent=cpu), headers=HEADERS)
    r = client.get("/api/metrics/history", params={"hostname": "test-pc", "minutes": 60})
    assert r.status_code == 200
    points = r.json()
    assert len(points) >= 1
    assert all(0 <= p["cpu_percent"] <= 100 for p in points)


def test_hosts_lists_online_host(client):
    client.post("/api/metrics", json=make_report(), headers=HEADERS)
    hosts = client.get("/api/hosts").json()
    assert len(hosts) == 1
    assert hosts[0]["hostname"] == "test-pc"
    assert hosts[0]["online"] is True
