import type { ModuleKind, ModuleResultMap, Workspace } from "./types";
import { mockRun, mockProfile } from "./mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
export { API_URL };

export function apiMode(): string {
  return API_URL ? "connected to " + API_URL : "mock mode — FastAPI not running";
}

export function apiConnected(): boolean {
  return Boolean(API_URL);
}

export async function runModule<K extends ModuleKind>(
  kind: K,
  payload: Record<string, unknown>,
): Promise<ModuleResultMap[K]> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return (await res.json()) as ModuleResultMap[K];
    } catch {
      // fall through to mock
    }
  }
  return (await mockRun(kind, payload, [])) as ModuleResultMap[K];
}

export async function createWorkspace(
  payload: Record<string, unknown>,
  existing: Workspace[],
): Promise<Workspace> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return (await res.json()) as Workspace;
    } catch {
      // fall through to mock
    }
  }
  const profile = mockProfile(existing);
  return {
    id: crypto.randomUUID(),
    name: String(payload.name ?? "Untitled"),
    website: String(payload.website ?? ""),
    industry: String(payload.industry ?? ""),
    createdAt: new Date().toISOString(),
    profile,
  };
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return true;
}

