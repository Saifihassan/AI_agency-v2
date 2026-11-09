"use client";

import { useEffect, useState } from "react";
import { apiMode, runModule } from "@/lib/api";
import { saveRun, loadRun, formatSaved } from "@/lib/cache";
import type { MarketIntelligenceReport } from "@/lib/types";
import { Empty, Kicker, Panel, RunBar , Reveal, SectionLabel } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

export default function NewsPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [industry, setIndustry] = useState("technology");
  const [data, setData] = useState<MarketIntelligenceReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const last = loadRun<MarketIntelligenceReport>("news");
    if (last?.data) {
      setData(last.data);
      setRestored(true);
    }
  }, []);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (running) return;
    setRunning(true);
    setError("");
    try {
      const res = (await runModule("news", {
        industry,
        workspace: active?.name,
      })) as MarketIntelligenceReport;
      setData(res);
      setRestored(false);
      saveRun("news", res);
      bumpUsage("Market News");
    } catch {
      setError("Run failed. Check the API and try again.");
    }
    setRunning(false);
  };

  return (
    <>
      <Reveal><div className="page-head">
        <h1>Market News</h1>
        <Kicker>
          <sup>(03)</sup>News researcher pulls the latest; market analyst turns
          it into intelligence for your agency.
        </Kicker>
      </div></Reveal>

      <Panel title="Pipeline">
        <form onSubmit={start}>
          <div className="field">
            <label>Industry focus</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="technology, real estate, e-commerce…"
            />
          </div>
          <button className="run" disabled={running}>
            {running ? "Running…" : "Generate intelligence report"}
          </button>
          <RunBar running={running} mode={apiMode()} />
          {error && <div className="error-note" style={{ marginTop: 10 }}>{error}</div>}
        </form>
      </Panel>

      {!data ? <Reveal i={2}><Empty>No intelligence report yet.</Empty></Reveal> : (
        <>
          {restored && (
            <p className="kicker" style={{ marginTop: 0 }}>
              Showing the last report from this session
            </p>
          )}
          <Panel title={undefined} tight={false}>
            {data.one_liner_headlines.map((h) => (
              <div className="headline-row" key={h}>→ {h}</div>
            ))}
            <p className="why" style={{ color: "var(--sub)", fontSize: 12.5, paddingTop: 10 }}>
              Generated {data.generated_at}
            </p>
          </Panel>

          <div className="grid2" style={{ marginTop: 0 }}>
            <Panel title="Trends">
              {data.market_trends.map((t) => (
                <div className="finding" key={t.title}>
                  <h4>{t.title}</h4>
                  <p>{t.description}</p>
                </div>
              ))}
            </Panel>
            <Panel title="Opportunities">
              {data.opportunities.map((o) => (
                <div className="finding" key={o.title}>
                  <h4>{o.title}</h4>
                  <p>{o.description}</p>
                </div>
              ))}
            </Panel>
          </div>

          {data.categorized_news.map((c) => (
            <Panel title={c.category} key={c.category}>
              {c.articles.map((a) => (
                <div className="finding" key={a.title}>
                  <h4>
                    {a.url !== "#" ? (
                      <a href={a.url} target="_blank" rel="noopener" style={{ color: "inherit" }}>
                        {a.title} ↗
                      </a>
                    ) : a.title}
                  </h4>
                  <p>{a.summary}</p>
                  <p className="why">{a.source} · {a.published_date}</p>
                </div>
              ))}
            </Panel>
          ))}
        </>
      )}
    </>
  );
}
