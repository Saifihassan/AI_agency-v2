"use client";

import { useEffect, useState } from "react";
import { createWorkspace } from "@/lib/api";
import { Kicker, BaseItems, Reveal, SectionLabel } from "@/components/ui";
import { Streamline, plusOneIncrement } from "@/components/icons";
import { useWorkspaces } from "@/components/workspace";

export default function WorkspacesPage() {
  const { workspaces, active, setActive, addWorkspace, usage } = useWorkspaces();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(workspaces.length === 0);

  useEffect(() => {
    if (workspaces.length === 0) setShowForm(true);
  }, [workspaces.length]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    const ws = await createWorkspace({ name, website, industry }, workspaces);
    addWorkspace(ws);
    setName(""); setWebsite(""); setIndustry("");
    setCreating(false);
    setShowForm(false);
    if (ws.profile) setActive(ws);
  };

  return (
    <>
      <Reveal><div className="page-head">
        <h1>Workspaces</h1>
        <Kicker>
          <sup>(00)</sup>Each workspace is a client. The AI-generated company
          profile context-powers every agent run.
        </Kicker>
      </div></Reveal>

      <div style={{ marginTop: 24 }}>
        {workspaces.map((w) => (
          <div
            key={w.id}
            role="button"
            tabIndex={0}
            onClick={() => setActive(w)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(w);
              }
            }}
            className={`workspace-btn ${active?.id === w.id ? "ws-row-active" : ""}`}
            style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <span className={`ws-dot ${active?.id === w.id ? "ws-dot-live" : ""}`} />
            <div className="ws-text">
              <span className="ws-name">{w.name}</span>
            </div>
            {active?.id === w.id && <span className="live-word">live</span>}
          </div>
        ))}
      </div>

      <button className="run" style={{ marginTop: 8 }} onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : (<><Streamline icon={plusOneIncrement} size={15} /> New workspace</>)}
      </button>

      {showForm && (
        <form onSubmit={create} style={{ marginTop: 20 }}>
          <div className="panel">
            <div className="field">
              <label>Company name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunset Realty" />
            </div>
            <div className="field">
              <label>Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
            <div className="field">
              <label>Industry</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. real estate" />
            </div>
            <button className="run" disabled={creating || !name.trim()}>
              {creating ? "Generating profile…" : "Create workspace"}
            </button>
            <p className="kicker" style={{ marginTop: 10 }}>
              The profile agent researches the site and generates the company profile.
            </p>
          </div>
        </form>
      )}

      {active?.profile && (
        <>
          <SectionLabel n="01">Active profile</SectionLabel>
          <div className="panel" style={{ marginTop: 8 }}>
            <dl className="kv">
              <dt>Summary</dt><dd>{active.profile.company_summary}</dd>
              <dt>Description</dt><dd>{active.profile.description}</dd>
              <dt>Services</dt><dd>{active.profile.products_services?.join(", ")}</dd>
              <dt>Audience</dt><dd>{active.profile.target_audience}</dd>
              <dt>Brand voice</dt><dd>{active.profile.brand_voice}</dd>
              <dt>Value prop</dt><dd>{active.profile.value_proposition}</dd>
            </dl>
            <p className="kicker" style={{ marginTop: 14 }}>KEYWORDS</p>
            <BaseItems items={active.profile.keywords ?? []} />
          </div>
        </>
      )}

      {Object.keys(usage).length > 0 && (
        <>
          <SectionLabel n="02">Module usage</SectionLabel>
          <div className="panel" style={{ marginTop: 8 }}>
            <div className="subjects">
              {Object.entries(usage).map(([mod, n]) => (
                <span key={mod} className={n > 2 ? "chip accent" : "chip"} style={{ margin: 0 }}>
                  {mod} × {n}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
