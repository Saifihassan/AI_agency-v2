"use client";

import { useEffect, useState } from "react";
import { apiMode, runModule } from "@/lib/api";
import { saveRun, loadRun, saveHistory, loadHistory, formatSaved } from "@/lib/cache";
import type { ResearchAnalysis, StrategyReport, Source } from "@/lib/types";
import { Empty, Kicker, Panel, RunBar, Reveal, SectionLabel } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

type Result = { research: ResearchAnalysis; strategy: StrategyReport };

const fmtDate = () =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

const TABS = ["Executive summary", "Findings", "Strategy"] as const;

export default function ResearchPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("quick");
  const [data, setData] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Executive summary");
  const [restored, setRestored] = useState(false);
  const [savedLabel, setSavedLabel] = useState("");
  const [history, setHistory] = useState<ReturnType<typeof loadHistory<Result>>>([]);

  useEffect(() => {
    const last = loadRun<Result>("research");
    if (last?.data) {
      setData(last.data);
      setRestored(true);
      setTab("Executive summary");
    }
    setHistory(loadHistory<Result>("research"));
  }, []);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || running) return;
    setRunning(true);
    setError("");
    try {
      const res = (await runModule("research", {
        topic,
        depth,
        workspace: active?.name,
      })) as Result;
      setData(res);
      setRestored(false);
      setSavedLabel(`${topic} · ${depth}`);
      saveRun("research", res);
      saveHistory("research", res, `${topic} · ${depth}`);
      setHistory(loadHistory<Result>("research"));
      setTab("Executive summary");
      bumpUsage("Research");
    } catch {
      setError("Run failed. Check the API and try again.");
    }
    setRunning(false);
  };

  const allSources: Source[] = [];
  if (data) {
    for (const f of data.research.findings) {
      for (const s of f.sources ?? []) {
        if (!allSources.some((x) => x.url === s.url)) allSources.push(s);
      }
    }
  }

  return (
    <>
      <Reveal>
        <div className="page-head">
          <h1>Research</h1>
          <Kicker>
            <sup>(02)</sup>Research analyst finds the signal; strategy advisor
            turns it into a playbook.
          </Kicker>
        </div>
      </Reveal>

      <Panel title="Research run">
        <form onSubmit={start}>
          <div className="field">
            <label>Topic or company</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI automation for real estate agencies in India"
            />
          </div>
          <div className="field">
            <label>Depth</label>
            <select value={depth} onChange={(e) => setDepth(e.target.value)}>
              <option value="quick">Quick — skimming headlines</option>
              <option value="standard">Standard — solid pass</option>
              <option value="deep">Deep — exhaustive dig</option>
            </select>
          </div>
          <button className="run" disabled={running || !topic.trim()}>
            {running ? "Running…" : "Run research"}
          </button>
          <RunBar running={running} mode={apiMode()} />
          {error && <div className="error-note" style={{ marginTop: 10 }}>{error}</div>}
        </form>
      </Panel>

      {history.length > 0 && (
        <div className="subjects" style={{ marginTop: "var(--space-2)" }}>
          <span className="sources-label" style={{ alignSelf: "center" }}>
            Previous reports
          </span>
          {history.map((h) =>
            data?.research.research_topic === h.label.split(" · ")[0] ? (
              <span key={h.saved} className="chip accent">
                {h.label} — {formatSaved(h.saved)}
              </span>
            ) : (
              <span
                key={h.saved}
                onClick={() => {
                  setData(h.data);
                  setRestored(true);
                  setTab("Executive summary");
                }}
              >
                {h.label} — {formatSaved(h.saved)}
              </span>
            ),
          )}
        </div>
      )}

      {!data ? (
        <Reveal i={2}>
          <Empty>No report yet.</Empty>
        </Reveal>
      ) : (
        <>
          <div className="report-shade">
            <div className="panel" style={{ marginTop: 0 }}>
              <h3 className="report-title">{data.research.report_title}</h3>
              <div className="report-meta">
                <span>Topic · {data.research.research_topic}</span>
                <span>Depth · {depth}</span>
                <span>Generated · {fmtDate()}</span>
                {restored && savedLabel && <span className="restored-tag">From last session</span>}
              </div>
            </div>
          </div>

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`tab ${tab === t ? "tab-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Findings" && ` (${data.research.findings.length})`}
                {t === "Executive summary" && ` · 01`}
                {t === "Strategy" && ` · 02`}
              </button>
            ))}
          </div>

          <div className="tab-view">
            {tab === "Executive summary" && (
              <div className="panel" style={{ marginTop: 0 }}>
                <div className="report-summary">{data.research.executive_summary}</div>
                <div className="summary-hint">
                  <span>{data.research.findings.length} findings</span>
                  <span>{allSources.length} sources processed</span>
                  <span>{data.strategy.prioritized_recommendations.length} recommendations</span>
                </div>
                <button className="link-btn" onClick={() => setTab("Findings")}>
                  Next: findings →
                </button>
              </div>
            )}

            {tab === "Findings" && (
              <>
                <SectionLabel n="01">Findings</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  {data.research.findings.map((f, i) => (
                    <div className="finding" key={f.title}>
                      <div className="finding-head">
                        <span className="finding-num">{String(i + 1).padStart(2, "0")}</span>
                        <h4>{f.title}</h4>
                      </div>
                      <p className="finding-body">{f.explanation}</p>
                      <p className="why">
                        <strong>Why it matters</strong> — {f.why_it_matters}
                      </p>
                      <div className="evidence">
                        {f.evidence.map((ev, j) => (
                          <span key={j}>{ev}</span>
                        ))}
                      </div>
                      {f.sources?.length > 0 && (
                        <div className="sources">
                          <span className="sources-label">Sources</span>
                          {f.sources.map((s, j) => (
                            <a
                              key={j}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="source-pill"
                            >
                              {s.publisher} · {s.title}
                            </a>
                          ))}
                        </div>
                      )}
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
                <SectionLabel n="02">Strategy</SectionLabel>
                <div className="report-strategy-stack">
                  <Panel title="Strategic overview" tight>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65 }}>
                      {data.strategy.strategic_overview}
                    </p>
                  </Panel>
                  <div className="grid2" style={{ marginTop: "var(--space-2)" }}>
                    <Panel title="Prioritized recommendations">
                      {data.strategy.prioritized_recommendations.map((r) => (
                        <div className="finding" key={r.title}>
                          <h4>{r.title}</h4>
                          <p>{r.description}</p>
                          <span className="impact-tag">{r.business_impact}</span>
                        </div>
                      ))}
                    </Panel>
                    <Panel title="Quick wins">
                      {data.strategy.quick_wins.map((q) => (
                        <div className="finding" key={q.title}>
                          <h4>{q.title}</h4>
                          <ol style={{ paddingLeft: 18, fontSize: 14, margin: "8px 0 0" }}>
                            {q.action_steps.map((s) => (
                              <li key={s} style={{ marginBottom: 5 }}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </Panel>
                  </div>
                  <div style={{ marginTop: "var(--space-2)" }}>
                    <Panel title="Long-term opportunities">
                      {data.strategy.long_term_opportunities.map((o) => (
                        <div className="finding" key={o.title}>
                          <h4>{o.title}</h4>
                          <p>{o.description}</p>
                        </div>
                      ))}
                    </Panel>
                    <p className="kicker report-conclusion">{data.strategy.conclusion}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {allSources.length > 0 && (
            <SectionLabel n="03">Sources processed</SectionLabel>
          )}
          {allSources.length > 0 && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="sources-full">
                {allSources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="source-row"
                  >
                    <span className="source-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="source-body">
                      <span className="source-title">{s.title}</span>
                      <span className="source-pub">{s.publisher}</span>
                    </span>
                    <span className="source-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
