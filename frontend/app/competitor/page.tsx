"use client";

import { useEffect, useState } from "react";
import { apiMode, runModule } from "@/lib/api";
import { saveRun, loadRun, formatSaved } from "@/lib/cache";
import type { CompetitiveAnalysis } from "@/lib/types";
import { Empty, Kicker, Panel, BaseItems, RunBar , Reveal, SectionLabel } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

export default function CompetitorPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [website, setWebsite] = useState("");
  const [data, setData] = useState<CompetitiveAnalysis | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);

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
      bumpUsage("Competitor");
    } catch {
      setError("Run failed. Check the API and try again.");
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
          <RunBar running={running} mode={apiMode()} />
          {error && <div className="error-note" style={{ marginTop: 10 }}>{error}</div>}
        </form>
      </Panel>

      {!data ? <Reveal i={2}><Empty>No analysis yet.</Empty></Reveal> : (
        <>
          {restored && (
            <p className="kicker" style={{ marginTop: 0 }}>
              Showing the last analysis from this session
            </p>
          )}
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

          <div className="grid2" style={{ marginTop: 4 }}>
            <Panel title="Strengths"><BaseItems items={data.strengths} /></Panel>
            <Panel title="Weaknesses"><BaseItems items={data.weaknesses} /></Panel>
          </div>

          <Panel title="Opportunities">
            {data.opportunities.map((o) => (
              <div className="finding" key={o.title}>
                <h4>{o.title}</h4>
                <p>{o.description}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Recommended strategy">
            <div className="copy-block">{data.recommended_strategy}</div>
          </Panel>
        </>
      )}
    </>
  );
}
