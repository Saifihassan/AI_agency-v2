"use client";

import { useEffect, useState } from "react";
import { apiMode, runModule, UsageLimitError } from "@/lib/api";
import { saveRun, loadRun, formatSaved } from "@/lib/cache";
import type { MarketIntelligenceReport } from "@/lib/types";
import { Empty, Kicker, Panel, RunBar, Reveal, SectionLabel } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

const TABS = ["Headlines", "Trends", "Opportunities", "News desk"] as const;

export default function NewsPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [industry, setIndustry] = useState("technology");
  const [data, setData] = useState<MarketIntelligenceReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Headlines");
  const [indLabel, setIndLabel] = useState("");

  useEffect(() => {
    const last = loadRun<MarketIntelligenceReport>("news");
    if (last?.data) {
      setData(last.data);
      setIndLabel(last.label || "");
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
      setIndLabel(industry);
      setRestored(false);
      saveRun("news", res, industry);
      setTab("Headlines");
      bumpUsage("Market News");
    } catch (err) {
      if (!(err instanceof UsageLimitError))
        setError(
          err instanceof Error ? `Run failed — ${err.message}` : "Run failed. Check the API and try again."
        );
    }
    setRunning(false);
  };

  const allSources: { title: string; url: string; source: string }[] = [];
  if (data) {
    for (const c of data.categorized_news) {
      for (const a of c.articles) {
        if (a.url && a.url !== "#" && !allSources.some((x) => x.url === a.url)) {
          allSources.push({ title: a.title, url: a.url, source: a.source });
        }
      }
    }
  }

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
          <RunBar running={running} mode={apiMode()} module="news" />
          {error && <div className="error-note" style={{ marginTop: 10 }}>{error}</div>}
        </form>
      </Panel>

      {!data ? (
        <Reveal i={2}>
          <Empty>No intelligence report yet.</Empty>
        </Reveal>
      ) : (
        <>
          {restored && (
            <p className="kicker" style={{ marginTop: 0 }}>
              <strong>Showing the last report from this session</strong>
            </p>
          )}
          {data.one_liner_headlines.length === 0 &&
          data.categorized_news.length === 0 &&
          data.market_trends.length === 0 &&
          data.opportunities.length === 0 ? (
            <Reveal i={1}>
              <Empty>
                Couldn&apos;t find any reportable news in the verified sources
                ({indLabel || industry}) for right now. The agent only reports
                from the trusted domain allowlist — no news there this time;
                try again in a bit.
              </Empty>
            </Reveal>
          ) : (
          <>
          <div className="report-shade">
            <div className="panel" style={{ marginTop: 0 }}>
              <h3 className="report-title">Industry intelligence</h3>
              <div className="report-meta">
                <span>Industry · {indLabel || "—"}</span>
                <span>Generated · {data.generated_at}</span>
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
                {t === "News desk" && ` (${data.categorized_news.length})`}
              </button>
            ))}
          </div>

          <div className="tab-view">
            {tab === "Headlines" && (
              <>
                <SectionLabel n="01">Headlines</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  {data.one_liner_headlines.map((h, i) => {
                    const linkable = h.url && h.url !== "#";
                    return linkable ? (
                      <a
                        className="headline-row"
                        key={`hl-${i}`}
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        → {h.headline} <span className="hl-arrow">↗</span>
                      </a>
                    ) : (
                      <div className="headline-row" key={`hl-${i}`}>→ {h.headline}</div>
                    );
                  })}
                </div>
              </>
            )}

            {tab === "Trends" && (
              <>
                <SectionLabel n="02">Market trends ({data.market_trends.length})</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  {data.market_trends.map((t) => (
                    <div className="finding" key={`t-${t.title}`}>
                      <h4>{t.title}</h4>
                      <p>{t.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "Opportunities" && (
              <>
                <SectionLabel n="03">Opportunities ({data.opportunities.length})</SectionLabel>
                <div className="panel" style={{ marginTop: 0 }}>
                  {data.opportunities.map((o) => (
                    <div className="finding" key={`o-${o.title}`}>
                      <h4>{o.title}</h4>
                      <p>{o.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "News desk" && (
              <>
                <SectionLabel n="04">Categorized news</SectionLabel>
                {data.categorized_news.map((c) => (
                  <Panel title={c.category} key={c.category}>
                    {c.articles.map((a) => (
                      <div className="finding" key={`a-${a.title}-${a.url}`}>
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
          </div>

          <div className="source-strip">
            <span className="strip-label">sources</span>
            {allSources.map((s, i) => (
              <a key={`src-${i}`} href={s.url} target="_blank" rel="noreferrer" className="strip-pill">
                {s.source} · {s.title}
              </a>
            ))}
          </div>
          </>
          )}
        </>
      )}
    </>
  );
}
