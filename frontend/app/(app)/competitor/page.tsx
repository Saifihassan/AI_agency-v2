"use client";

import { useEffect, useState } from "react";
import { apiMode, runModule, UsageLimitError } from "@/lib/api";
import { saveRun, loadRun, formatSaved } from "@/lib/cache";
import type { CompetitiveAnalysis } from "@/lib/types";
import { Empty, Kicker, Panel, BaseItems, RunBar, Reveal, SectionLabel } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

const TABS = ["Snapshot", "Strengths & weaknesses", "Opportunities", "Strategy"] as const;

export default function CompetitorPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [website, setWebsite] = useState("");
  const [data, setData] = useState<CompetitiveAnalysis | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Snapshot");

  useEffect(() => {
    const last = loadRun<CompetitiveAnalysis>("competitor");
    if (last?.data) {
      setData(last.data);
      setRestored(true);
    }
  }, []);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website.trim() || running) return;
    setRunning(true);
    setError("");
    try {
      const res = (await runModule("competitor", {
        website,
        workspace: active?.name,
      })) as CompetitiveAnalysis;
      setData(res);
      setRestored(false);
      saveRun("competitor", res);
      setTab("Snapshot");
      bumpUsage("Competitor");
    } catch (err) {
      if (!(err instanceof UsageLimitError))
        setError(
          err instanceof Error ? `Run failed — ${err.message}` : "Run failed. Check the API and try again."
        );
    }
    setRunning(false);
  };

  return (
    <>
      <Reveal><div className="page-head">
        <h1>Competitor</h1>
        <Kicker>
          <sup>(05)</sup>Point at a competitor's website. Get their snapshot,
          gaps, and how to attack.
        </Kicker>
      </div></Reveal>

      <Panel title="Target">
        <form onSubmit={start}>
          <div className="field">
            <label>Competitor website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://competitor.com"
            />
          </div>
          <button className="run" disabled={running || !website.trim()}>
            {running ? "Running…" : "Analyze competitor"}
          </button>
          <RunBar running={running} mode={apiMode()} module="competitor" />
          {error && <div className="error-note" style={{ marginTop: 10 }}>{error}</div>}
        </form>
      </Panel>

      {!data ? (
        <Reveal i={2}>
          <Empty>No analysis yet.</Empty>
        </Reveal>
      ) : (
        <>
          {restored && (
            <p className="kicker" style={{ marginTop: 0 }}>
              <strong>Showing the last analysis from this session</strong>
            </p>
          )}
          <div className="report-shade">
            <div className="panel" style={{ marginTop: 0 }}>
              <h3 className="report-title">
                {data.company_snapshot.company_name || "Competitor analysis"}
              </h3>
              <div className="report-meta">
                <span>{data.company_snapshot.industry || "—"}</span>
                <span>{data.company_snapshot.market_position || "—"}</span>
              </div>
            </div>
          </div>

          <div className="tabs" role="tablist">
            {TABS.map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`tab ${tab === t ? "tab-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t} · 0{i + 1}
              </button>
            ))}
          </div>

          <div className="tab-view">
            {tab === "Snapshot" && (
              <>
                <SectionLabel n="01">Snapshot</SectionLabel>
                <Panel title="Company snapshot" tight>
                  <dl className="kv">
                    <dt>Company</dt><dd>{data.company_snapshot.company_name}</dd>
                    <dt>Overview</dt><dd>{data.company_snapshot.company_overview}</dd>
                    <dt>Industry</dt><dd>{data.company_snapshot.industry}</dd>
                    <dt>Audience</dt><dd>{data.company_snapshot.target_audience}</dd>
                    <dt>Position</dt><dd>{data.company_snapshot.market_position}</dd>
                    <dt>Differentiator</dt><dd>{data.company_snapshot.core_differentiator}</dd>
                  </dl>
                </Panel>
                <button className="link-btn" onClick={() => setTab("Strengths & weaknesses")}>
                  Next: strengths & weaknesses →
                </button>
              </>
            )}

            {tab === "Strengths & weaknesses" && (
              <>
                <SectionLabel n="02">Strengths & weaknesses</SectionLabel>
                <div className="grid2" style={{ marginTop: 0 }}>
                  <Panel title="Strengths"><BaseItems items={data.strengths} /></Panel>
                  <Panel title="Weaknesses"><BaseItems items={data.weaknesses} /></Panel>
                </div>
                <button className="link-btn" onClick={() => setTab("Opportunities")}>
                  Next: opportunities →
                </button>
              </>
            )}

            {tab === "Opportunities" && (
              <>
                <SectionLabel n="03">Opportunities ({data.opportunities.length})</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  {data.opportunities.map((o) => (
                    <div className="finding" key={o.title}>
                      <h4>{o.title}</h4>
                      <p>{o.description}</p>
                    </div>
                  ))}
                </div>
                <button className="link-btn" onClick={() => setTab("Strategy")}>
                  Next: strategy →
                </button>
              </>
            )}

            {tab === "Strategy" && (
              <>
                <SectionLabel n="04">Recommended strategy</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  <div className="copy-block">{data.recommended_strategy}</div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
