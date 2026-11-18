import type { ModuleKind, ModuleResultMap, Workspace } from "./types";
import { mockRun, mockProfile } from "./mock";
import { authHeader } from "./supabase/authheader";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
export { API_URL };

export function apiMode(): string {
  return API_URL ? "connected" : "mock mode — FastAPI not running";
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
      const auth = await authHeader();
      const res = await fetch(`${API_URL}/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(payload),
      });
      if (res.ok) return (await res.json()) as ModuleResultMap[K];
      console.warn(`[API] /api/${kind} returned status ${res.status}`);
    } catch (err) {
      console.warn(`[API] /api/${kind} request failed:`, err);
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
      const auth = await authHeader();
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(payload),
      });
      if (res.ok) return (await res.json()) as Workspace;
      console.warn(`[API] /api/workspaces returned status ${res.status}`);
    } catch (err) {
      console.warn("[API] /api/workspaces request failed:", err);
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
      const auth = await authHeader();
      const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
        method: "DELETE",
        headers: auth,
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return true;
}

