"use client";

import { useEffect, useState } from "react";
import { apiMode, runModule, UsageLimitError } from "@/lib/api";
import { saveRun, loadRun, formatSaved } from "@/lib/cache";
import type { ProspectAnalysis, OutreachSequence } from "@/lib/types";
import { Empty, Kicker, Panel, BaseItems, RunBar, Reveal, SectionLabel } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

type Result = {
  prospect_analysis: ProspectAnalysis;
  outreach_sequence: OutreachSequence;
};

const TABS = ["Prospect analysis", "Sequence", "CTA"] as const;

export default function OutreachPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [website, setWebsite] = useState("");
  const [service, setService] = useState("");
  const [tone, setTone] = useState("Direct");
  const [data, setData] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Prospect analysis");

  useEffect(() => {
    const last = loadRun<Result>("outreach");
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
      const res = (await runModule("outreach", {
        website,
        service,
        tone,
        workspace: active?.name,
      })) as Result;
      setData(res);
      setRestored(false);
      saveRun("outreach", res);
      setTab("Prospect analysis");
      bumpUsage("Outreach");
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
        <h1>Outreach</h1>
        <Kicker>
          <sup>(04)</sup>Drop a prospect's website. The agent analyzes it, then
          writes a sequence you'd actually reply to.
        </Kicker>
      </div></Reveal>

      <Panel title="Prospect">
        <form onSubmit={start}>
          <div className="field">
            <label>Prospect website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://theirbusiness.com"
            />
          </div>
          <div className="field">
            <label>Service you're offering</label>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder={active?.name ? "e.g. AI automation for [your niche]" : "e.g. AI automation"}
            />
          </div>
          <div className="field">
            <label>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              {["Direct", "Friendly", "Professional", "Consultative", "Founder-to-Founder"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button className="run" disabled={running || !website.trim()}>
            {running ? "Running…" : "Generate sequence"}
          </button>
          <RunBar running={running} mode={apiMode()} module="outreach" />
          {error && <div className="error-note" style={{ marginTop: 10 }}>{error}</div>}
        </form>
      </Panel>

      {!data ? (
        <Reveal i={2}>
          <Empty>No sequence yet.</Empty>
        </Reveal>
      ) : (
        <>
          {restored && (
            <p className="kicker" style={{ marginTop: 0 }}>
              <strong>Showing the last sequence from this session</strong>
            </p>
          )}
          <div className="report-shade">
            <div className="panel" style={{ marginTop: 0 }}>
              <h3 className="report-title">
                {data.prospect_analysis.company_summary.split(/[.—-]/)[0] || "Outreach sequence"}
              </h3>
              <div className="report-meta">
                <span>Prospect · {website}</span>
                <span>Tone · {data.outreach_sequence.tone}</span>
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
            {tab === "Prospect analysis" && (
              <>
                <SectionLabel n="01">Analysis</SectionLabel>
                <Panel title="Prospect analysis" tight>
                  <dl className="kv">
                    <dt>Summary</dt><dd>{data.prospect_analysis.company_summary}</dd>
                    <dt>Audience</dt><dd>{data.prospect_analysis.target_audience}</dd>
                    <dt>Positioning</dt><dd>{data.prospect_analysis.current_positioning}</dd>
                    <dt>Angle</dt><dd>{data.prospect_analysis.outreach_angle}</dd>
                    <dt>Value prop</dt><dd>{data.prospect_analysis.value_proposition}</dd>
                  </dl>
                  <SectionLabel n="A">Pain points</SectionLabel>
                  <BaseItems items={data.prospect_analysis.identified_pain_points} />
                </Panel>
                <button className="link-btn" onClick={() => setTab("Sequence")}>
                  Next: sequence →
                </button>
              </>
            )}

            {tab === "Sequence" && (
              <>
                <SectionLabel n="02">
                  Sequence — {data.outreach_sequence.tone.toUpperCase()} TONE
                </SectionLabel>
                <Panel title="Subject lines">
                  <div className="subjects">
                    {data.outreach_sequence.subject_lines.map((s) => <span key={s}>{s}</span>)}
                  </div>
                </Panel>
                <Panel title="Cold email"><div className="copy-block">{data.outreach_sequence.cold_email}</div></Panel>
                <Panel title="Follow-up 1"><div className="copy-block">{data.outreach_sequence.follow_up_email_1}</div></Panel>
                <Panel title="Follow-up 2"><div className="copy-block">{data.outreach_sequence.follow_up_email_2}</div></Panel>
                <button className="link-btn" onClick={() => setTab("CTA")}>
                  Next: CTA →
                </button>
              </>
            )}

            {tab === "CTA" && (
              <>
                <SectionLabel n="03">Call to action</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  <p
                    style={{
                      color: "var(--accent)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 16,
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {data.outreach_sequence.call_to_action}
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
