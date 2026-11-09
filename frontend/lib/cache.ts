export type CachedRun<T> = { saved: string; data: T };
export type HistoryEntry<T> = { saved: string; label: string; data: T };

const keyOf = (k: string) => `agencyos_run_${k}`;

export function saveRun<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      keyOf(key),
      JSON.stringify({ saved: new Date().toISOString(), data }),
    );
  } catch {}
}

export function loadRun<T>(key: string): CachedRun<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyOf(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveHistory<T>(key: string, data: T, label: string, limit = 6) {
  if (typeof window === "undefined") return;
  try {
    const entry: HistoryEntry<T> = { saved: new Date().toISOString(), label, data };
    const prev = loadHistory<T>(key);
    const next = [entry, ...prev.filter((e) => e.label !== label)].slice(0, limit);
    localStorage.setItem(keyOf(key) + "_history", JSON.stringify(next));
  } catch {}
}

export function loadHistory<T>(key: string): HistoryEntry<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyOf(key) + "_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const fmtTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});
const fmtDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function formatSaved(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay ? fmtTime.format(d) : fmtDate.format(d);
}
