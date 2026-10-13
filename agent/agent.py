"""Monitoring agent: collects metrics and sends them to the backend every few seconds.

Usage (from the agent/ folder, venv active):
    python agent.py
    python agent.py --url http://localhost:8000 --key dev-agent-key --interval 5

Settings can also come from environment variables:
    MONITOR_URL, MONITOR_API_KEY, MONITOR_INTERVAL
"""
import argparse
import logging
import os
import time

import psutil
import requests

from collector import collect_metrics

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("agent")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="System monitoring agent")
    parser.add_argument("--url", default=os.getenv("MONITOR_URL", "http://localhost:8000"))
    parser.add_argument("--key", default=os.getenv("MONITOR_API_KEY", "dev-agent-key"))
    parser.add_argument("--interval", type=float, default=float(os.getenv("MONITOR_INTERVAL", "5")))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    endpoint = args.url.rstrip("/") + "/api/metrics"
    headers = {"X-API-Key": args.key}

    psutil.cpu_percent(interval=None)  # prime the CPU counter; the first reading is always 0
    log.info("Agent started -> %s every %gs", endpoint, args.interval)

    with requests.Session() as session:
        while True:
            started = time.monotonic()
            try:
                payload = collect_metrics()
                response = session.post(endpoint, json=payload, headers=headers, timeout=5)
                response.raise_for_status()
                log.info(
                    "sent cpu=%.1f%% ram=%.1f%% disk=%.1f%%",
                    payload["cpu_percent"], payload["ram_percent"], payload["disk_percent"],
                )
            except requests.RequestException as exc:
                log.warning("could not reach backend (%s); will retry", exc)
            except Exception:
                log.exception("unexpected error collecting metrics")

            time.sleep(max(0.0, args.interval - (time.monotonic() - started)))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("Agent stopped")
