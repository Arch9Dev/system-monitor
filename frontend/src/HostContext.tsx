import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { usePolling } from "./hooks";
import type { Host } from "./types";

interface HostState {
  hosts: Host[];
  selected: string | null;
  select: (hostname: string) => void;
  apiError: string | null;
}

const Ctx = createContext<HostState>({ hosts: [], selected: null, select: () => {}, apiError: null });
export const useHosts = () => useContext(Ctx);

export function HostProvider({ children }: { children: ReactNode }) {
  const { data, error } = usePolling(api.hosts, [], 5000);
  const hosts = useMemo(() => data ?? [], [data]);
  const [selected, setSelected] = useState<string | null>(() => localStorage.getItem("host"));

  // pick a sensible host when nothing (or something stale) is selected
  useEffect(() => {
    if (hosts.length && (!selected || !hosts.some((h) => h.hostname === selected))) {
      setSelected(hosts[0].hostname);
    }
  }, [hosts, selected]);

  const select = (hostname: string) => {
    setSelected(hostname);
    localStorage.setItem("host", hostname);
  };

  return <Ctx.Provider value={{ hosts, selected, select, apiError: error }}>{children}</Ctx.Provider>;
}
