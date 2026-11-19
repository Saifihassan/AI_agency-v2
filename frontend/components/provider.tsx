"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeader } from "@/lib/supabase/authheader";

export type Provider = {
  id: string;
  label: string;
  base_url: string;
  models: string[];
  model_map: Record<string, string>;
  is_active: boolean;
};

type ProviderState = {
  ready: boolean;
  configured: boolean;
  providers: Provider[];
  activeId: string | null;
  models: string[];
  modelMap: Record<string, string>;
  busy: boolean;
  error: string;
  addProvider: (baseUrl: string, apiKey: string, label?: string) => Promise<boolean>;
  removeProvider: (id: string) => Promise<void>;
  activate: (id: string) => Promise<void>;
  setModel: (module: string, model: string) => Promise<void>;
  modelFor: (module: string) => string;
};

const empty: ProviderState = {
  ready: false,
  configured: false,
  providers: [],
  activeId: null,
  models: [],
  modelMap: {},
  busy: false,
  error: "",
  addProvider: async () => false,
  removeProvider: async () => {},
  activate: async () => {},
  setModel: async () => {},
  modelFor: () => "",
};

const ProviderContext = createContext<ProviderState>(empty);

type Payload = {
  configured: boolean;
  providers: Provider[];
  active_id: string | null;
  base_url: string | null;
  models: string[];
  model_map: Record<string, string>;
};

const EMPTY_PAYLOAD: Payload = {
  configured: false,
  providers: [],
  active_id: null,
  base_url: null,
  models: [],
  model_map: {},
};

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<Payload>(EMPTY_PAYLOAD);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!API_URL) {
      setReady(true);
      return;
    }
    try {
      const auth = await authHeader();
      const res = await fetch(`${API_URL}/api/providers`, { headers: auth });
      if (res.ok) setPayload(await res.json());
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const apply = useCallback((next: Payload) => {
    setPayload(next);
    setError("");
    window.dispatchEvent(new Event("agencyos:usage-changed"));
  }, []);

  const request = useCallback(
    async (path: string, init: RequestInit, fallbackMessage: string) => {
      setBusy(true);
      try {
        const auth = await authHeader();
        const res = await fetch(`${API_URL}${path}`, {
          ...init,
          headers: { ...auth, ...(init.headers || {}) },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError((data?.detail as string) || fallbackMessage);
          return;
        }
        apply(data as Payload);
      } catch {
        setError("Could not reach the backend.");
      } finally {
        setBusy(false);
      }
    },
    [apply]
  );

  const addProvider = useCallback(
    async (baseUrl: string, apiKey: string, label?: string) => {
      setBusy(true);
      setError("");
      try {
        const auth = await authHeader();
        const res = await fetch(`${API_URL}/api/providers`, {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ base_url: baseUrl, api_key: apiKey, label }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError((data?.detail as string) || "Could not connect that provider.");
          return false;
        }
        apply(data as Payload);
        return true;
      } catch {
        setError("Could not reach the backend.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [apply]
  );

  const removeProvider = useCallback(
    (id: string) => request(`/api/providers/${id}`, { method: "DELETE" }, "Could not remove the provider."),
    [request]
  );

  const activate = useCallback(
    (id: string) => request(`/api/providers/${id}/activate`, { method: "POST" }, "Could not switch providers."),
    [request]
  );

  const setModel = useCallback(
    async (module: string, model: string) => {
      setPayload((p) => ({ ...p, model_map: { ...p.model_map, [module]: model } }));
      await request(
        "/api/providers/model",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module, model }),
        },
        "Could not save the model choice."
      );
    },
    [request]
  );

  const modelFor = useCallback(
    (module: string) => payload.model_map[module] || payload.models[0] || "",
    [payload]
  );

  return (
    <ProviderContext.Provider
      value={{
        ready,
        configured: payload.configured,
        providers: payload.providers,
        activeId: payload.active_id,
        models: payload.models,
        modelMap: payload.model_map,
        busy,
        error,
        addProvider,
        removeProvider,
        activate,
        setModel,
        modelFor,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  return useContext(ProviderContext);
}
