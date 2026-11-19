"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeader } from "@/lib/supabase/authheader";
import { Kicker, Reveal } from "@/components/ui";
import { useProvider } from "@/components/provider";

export default function SettingsPage() {
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [providerLabel, setProviderLabel] = useState("");
  const {
    ready: providerReady,
    configured,
    providers,
    activeId,
    models,
    busy,
    error,
    addProvider,
    removeProvider,
    activate,
    modelFor,
    setModel,
  } = useProvider();
  const [usage, setUsage] = useState<{
    limit: number;
    window_hours: number;
    modules: Record<string, { used: number; limit: number; remaining: number; reset_at: string | null }>;
  } | null>(null);

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
    if (API_URL) {
      authHeader()
        .then((auth) => fetch(`${API_URL}/api/usage`, { headers: auth }))
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => u && setUsage(u))
        .catch(() => {});
    }
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
        <div className="panel" style={{ marginTop: "var(--space-3)" }} id="api-keys">
          <h3 className="panel-title" style={{ margin: 0 }}>Your own API keys</h3>
          <p style={{ color: "var(--sub)", fontSize: 13.5, margin: "8px 0 0" }}>
            Connect one or more OpenAI-compatible providers. Add as many as you
            like, switch between them anytime, and pick a model per module.
            Models must support tool calling and structured outputs.
          </p>

          {!providerReady ? (
            <p style={{ color: "var(--sub)", fontSize: 13.5, margin: "14px 0 0" }}>
              Checking providers…
            </p>
          ) : (
            <>
              {providers.length > 0 && (
                <div className="provider-list">
                  {providers.map((p) => (
                    <div key={p.id} className={`provider-item ${p.is_active ? "provider-item-active" : ""}`}>
                      <button
                        className={`provider-radio ${p.is_active ? "on" : ""}`}
                        aria-label={p.is_active ? "Active provider" : `Switch to ${p.label}`}
                        onClick={() => !p.is_active && void activate(p.id)}
                        disabled={busy}
                      />
                      <div className="provider-item-text">
                        <strong>{p.label}</strong>
                        <span>{p.base_url}</span>
                      </div>
                      <span className="provider-count">{p.models.length} models</span>
                      {p.is_active && <span className="provider-tag">active</span>}
                      <button
                        className="provider-remove"
                        onClick={() => void removeProvider(p.id)}
                        disabled={busy}
                        aria-label={`Remove ${p.label}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                className="provider-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await addProvider(baseUrl, apiKey, providerLabel);
                  if (ok) {
                    setBaseUrl("");
                    setApiKey("");
                    setProviderLabel("");
                  }
                }}
              >
                <label className="field">
                  <span>Name (optional)</span>
                  <input
                    type="text"
                    placeholder="OpenAI"
                    value={providerLabel}
                    onChange={(e) => setProviderLabel(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Base URL</span>
                  <input
                    type="url"
                    required
                    placeholder="https://api.openai.com/v1"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>API key</span>
                  <input
                    type="password"
                    required
                    placeholder="sk-…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <button className="run" type="submit" disabled={busy}>
                  {busy ? "Checking…" : "Add provider"}
                </button>
              </form>
              {error && <div className="error-note">{error}</div>}

              {configured && models.length > 0 && (
                <>
                  <p className="provider-usage-title">Models of the active provider</p>
                  <div className="module-model-grid">
                    {["studio", "research", "news", "outreach", "competitor"].map((mod) => (
                      <label key={mod} className="module-model">
                        <span>{mod}</span>
                        <select
                          value={modelFor(mod)}
                          onChange={(e) => void setModel(mod, e.target.value)}
                        >
                          {models.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {!configured && usage && (
                <>
                  <p className="provider-usage-title">Shared engine usage</p>
                  <dl className="kv">
                    {Object.entries(usage.modules).map(([mod, u]) => (
                      <div key={mod} style={{ display: "contents" }}>
                        <dt style={{ textTransform: "capitalize" }}>{mod}</dt>
                        <dd>
                          <span className={`status ${u.remaining > 0 ? "ok" : "idle"}`} style={{ display: "inline-block" }}>
                            {u.used} / {u.limit} used
                          </span>
                          {u.remaining === 0 && u.reset_at
                            ? ` · refills ${new Date(u.reset_at).toLocaleString()}`
                            : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </>
          )}
        </div>
      </Reveal>

      <Reveal i={3}>
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
