export type Severity = "info" | "warning" | "critical";
export type MetricName = "cpu_percent" | "ram_percent" | "disk_percent";

export interface Host {
  hostname: string;
  online: boolean;
  last_seen: string;
  uptime_seconds: number;
}

export interface Metric {
  id: number;
  hostname: string;
  recorded_at: string;
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
  uptime_seconds: number;
  cpu_cores: number | null;
  ram_total_bytes: number | null;
  ram_used_bytes: number | null;
  disk_total_bytes: number | null;
  disk_used_bytes: number | null;
}

export interface HistoryPoint {
  time: string;
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
}

export interface AlertRule {
  id: number;
  name: string;
  metric: MetricName;
  operator: ">" | "<";
  threshold: number;
  severity: Severity;
  hostname: string | null;
  enabled: boolean;
  created_at: string;
}

export type NewAlertRule = Omit<AlertRule, "id" | "created_at">;

export interface EventItem {
  id: number;
  created_at: string;
  category: string;
  type: "alert" | "resolved";
  severity: Severity;
  hostname: string | null;
  rule_id: number | null;
  message: string;
  value: number | null;
}

export interface EventSummary {
  total: number;
  info: number;
  warning: number;
  critical: number;
}
