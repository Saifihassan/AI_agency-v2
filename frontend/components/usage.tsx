"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeader } from "@/lib/supabase/authheader";

export type ModuleUsage = {
  module: string;
  used: number;
  limit: number;
  remaining: number;
  reset_at: string | null;
};

type UsageState = {
  ready: boolean;
  limit: number;
  windowHours: number;
  modules: Record<string, ModuleUsage>;
  refresh: () => void;
};

const UsageContext = createContext<UsageState>({
  ready: false,
  limit: 3,
  windowHours: 24,
  modules: {},
  refresh: () => {},
});

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<UsageState, "refresh">>({
    ready: false,
    limit: 3,
    windowHours: 24,
    modules: {},
  });
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (!API_URL || inFlight.current) return;
    inFlight.current = true;
    authHeader()
      .then((auth) => fetch(`${API_URL}/api/usage`, { headers: auth }))
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!u) return;
        setState({
          ready: true,
          limit: u.limit,
          windowHours: u.window_hours,
          modules: u.modules,
        });
      })
      .catch(() => {})
      .finally(() => {
        inFlight.current = false;
      });
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("agencyos:usage-changed", onChange);
    window.addEventListener("agencyos:usage-limit", onChange);
    return () => {
      window.removeEventListener("agencyos:usage-changed", onChange);
      window.removeEventListener("agencyos:usage-limit", onChange);
    };
  }, [refresh]);

  return (
    <UsageContext.Provider value={{ ...state, refresh }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  return useContext(UsageContext);
}
