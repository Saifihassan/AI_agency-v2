"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Workspace, CompanyProfile } from "@/lib/types";
import { API_URL, apiConnected } from "@/lib/api";
import { authHeader } from "@/lib/supabase/authheader";

type WorkspaceCtx = {
  workspaces: Workspace[];
  active: Workspace | null;
  setActive: (w: Workspace) => void;
  addWorkspace: (input: {
    name: string;
    website: string;
    industry: string;
    profile: CompanyProfile | null;
  }) => void;
  removeWorkspace: (id: string) => void;
  usage: Record<string, number>;
  bumpUsage: (mod: string) => void;
  recent: string[];
};

const Ctx = createContext<WorkspaceCtx | null>(null);

const KEY = "agency_os_v2_state";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const p = JSON.parse(stored) as {
        workspaces: Workspace[];
        activeId: string | null;
        usage: Record<string, number>;
        recent: string[];
      };
      setWorkspaces(p.workspaces ?? []);
      setUsage(p.usage ?? {});
      setRecent(p.recent ?? []);
      if (p.workspaces?.length) setActiveId(p.activeId ?? p.workspaces[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ workspaces, activeId, usage, recent })
    );
  }, [workspaces, activeId, usage, recent]);

  useEffect(() => {
    if (!apiConnected()) return;
    authHeader().then((auth) =>
      fetch(`${API_URL}/api/workspaces`, { headers: auth })
        .then((r) => (r.ok ? r.json() : null))
        .then((list: Workspace[] | null) => {
          if (!list) return;
          setWorkspaces(list);
          setActiveId(list[0]?.id ?? null);
        })
        .catch(() => {}),
    );
  }, []);

  const active =
    workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;

  const addWorkspace: WorkspaceCtx["addWorkspace"] = (input) => {
    const w: Workspace = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input };
    setWorkspaces((prev) => [...prev, w]);
    setActiveId(w.id);
  };

  const removeWorkspace: WorkspaceCtx["removeWorkspace"] = (id) => {
    setWorkspaces((prev) => {
      const next = prev.filter((w) => w.id !== id);
      setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const bumpUsage: WorkspaceCtx["bumpUsage"] = (mod) => {
    setUsage((u) => ({ ...u, [mod]: (u[mod] ?? 0) + 1 }));
    setRecent((r) => [mod, ...r.filter((m) => m !== mod)].slice(0, 5));
  };

  return (
    <Ctx.Provider
      value={{
        workspaces,
        active,
        setActive: (w) => setActiveId(w.id),
        addWorkspace,
        removeWorkspace,
        usage,
        bumpUsage,
        recent,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspaces outside provider");
  return ctx;
}
