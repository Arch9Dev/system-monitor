import type { AlertRule, EventItem, EventSummary, HistoryPoint, Host, Metric, NewAlertRule } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const q = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && s.set(k, String(v)));
  return s.toString();
};

export const api = {
  hosts: () => request<Host[]>("/api/hosts"),
  latest: (hostname: string) => request<Metric>(`/api/metrics/latest?${q({ hostname })}`),
  history: (hostname: string, minutes: number) =>
    request<HistoryPoint[]>(`/api/metrics/history?${q({ hostname, minutes, points: 120 })}`),
  events: (params: { limit?: number; severity?: string; hostname?: string } = {}) =>
    request<EventItem[]>(`/api/events?${q(params)}`),
  eventSummary: (hours = 24) => request<EventSummary>(`/api/events/summary?${q({ hours })}`),
  rules: () => request<AlertRule[]>("/api/alert-rules"),
  createRule: (rule: NewAlertRule) =>
    request<AlertRule>("/api/alert-rules", { method: "POST", body: JSON.stringify(rule) }),
  updateRule: (id: number, patch: Partial<NewAlertRule>) =>
    request<AlertRule>(`/api/alert-rules/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteRule: (id: number) => request<void>(`/api/alert-rules/${id}`, { method: "DELETE" }),
};
