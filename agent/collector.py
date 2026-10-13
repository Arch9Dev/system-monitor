"""Reads REAL metrics from the machine this script runs on (via psutil)."""
import os
import socket
import time

import psutil


def collect_metrics() -> dict:
    """Return one snapshot in the shape the backend's MetricReport expects."""
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(os.path.abspath(os.sep))  # C:\ on Windows, / on Linux/macOS

    return {
        "hostname": socket.gethostname(),
        # interval=None -> CPU use since the previous call (the loop calls us every few seconds)
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_percent": memory.percent,
        "disk_percent": disk.percent,
        "uptime_seconds": int(time.time() - psutil.boot_time()),
        "cpu_cores": psutil.cpu_count(logical=True),
        "ram_total_bytes": memory.total,
        "ram_used_bytes": memory.used,
        "disk_total_bytes": disk.total,
        "disk_used_bytes": disk.used,
    }
