"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Kicker, Reveal } from "@/components/ui";

export default function SettingsPage() {
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!API_URL) {
      setApiUp(false);
    } else {
      fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(4000) })
        .then((r) => setApiUp(r.ok))
        .catch(() => setApiUp(false));
    }
    try {
      let n = 0;
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)?.startsWith("agencyos_")) n++;
      }
      setSavedCount(n);
    } catch {}
  }, []);

  const clearSaved = () => {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("agencyos_")) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
    setSavedCount(0);
    setCleared(true);
  };

  return (
    <>
      <Reveal>
        <div className="page-head">
          <h1>Settings</h1>
          <Kicker>
            <sup>(07)</sup>How this OS is wired on your machine — and how to
            wipe local run history.
          </Kicker>
        </div>
      </Reveal>

      <Reveal i={1}>
        <div className="panel" style={{ marginTop: 0 }}>
          <dl className="kv">
            <dt>API mode</dt>
            <dd>
              <span className={`status ${apiUp ? "ok" : "idle"}`} style={{ display: "inline-block" }}>
                {apiUp === null ? "checking…" : apiUp ? "live backend" : "mock mode"}
              </span>
            </dd>
            <dt>Backend URL</dt>
            <dd>{API_URL || "— (uses lib/api default)"}</dd>
            <dt>Backend health</dt>
            <dd>
              {apiUp === null ? "—" : apiUp ? `${API_URL}/api/health → ok` : "unreachable — reports fall back to mock"}
            </dd>
            <dt>Saved runs (local)</dt>
            <dd>{savedCount} entries in this browser cache</dd>
            <dt>Storage note</dt>
            <dd>
              Run history and chat history live only in this browser
              (localStorage). Reports, profiles and chat stay in the backend
              SQLite database.
            </dd>
          </dl>
        </div>
      </Reveal>

      <Reveal i={2}>
        <div className="panel" style={{ marginTop: "var(--space-3)" }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Wipe local cache</h3>
          <p style={{ color: "var(--sub)", fontSize: 13.5, margin: "8px 0 0" }}>
            Deletes every locally saved report and chat history in this browser.
            The backend database is not touched.
          </p>
          <button className="run danger-run" onClick={clearSaved} style={{ marginTop: 14 }}>
            {cleared ? "Cleared ✓" : `Clear ${savedCount} saved runs`}
          </button>
        </div>
      </Reveal>
    </>
  );
}
