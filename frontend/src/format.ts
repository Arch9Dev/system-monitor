export function formatBytes(bytes: number | null | undefined): { value: string; unit: string } {
  if (bytes == null) return { value: "–", unit: "" };
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return { value: n >= 100 || i === 0 ? n.toFixed(0) : n.toFixed(1), unit: units[i] };
}

export const bytesText = (bytes: number | null | undefined) => {
  const { value, unit } = formatBytes(bytes);
  return `${value} ${unit}`.trim();
};

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const METRIC_LABEL: Record<string, string> = {
  cpu_percent: "CPU usage",
  ram_percent: "Memory usage",
  disk_percent: "Disk usage",
};
