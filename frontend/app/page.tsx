"use client";

import Link from "next/link";
import { useWorkspaces, WorkspaceProvider } from "@/components/workspace";
import { useAuthUser } from "@/lib/supabase/useauth";
import LandNav from "@/components/landnav";
import LandPreview from "@/components/land-preview";
import {
  Streamline,
  networkSearch,
  newspaperFold,
  sendEmailFly,
  dataTransferDiagonal1,
  pencil1,
  businessCard1,
} from "@/components/icons";

const SIGNALS = [
  {
    n: "06",
    label: "Specialist agents",
    desc: "Profile, Research, Market News, Outreach, Competitor, and Content Studio.",
  },
  {
    n: "11",
    label: "Allowlisted outlets",
    desc: "Market briefs pull exclusively from trusted domains like Reuters, BBC, NIST, and WARC.",
  },
  {
    n: "01",
    label: "Shared client profile",
    desc: "Indexed once from a website URL and automatically inherited by every agent run.",
  },
  {
    n: "2×",
    label: "Paired deliverables",
    desc: "Research outputs pair with strategy playbooks; prospect teardowns pair with email sequences.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Index a client workspace",
    desc: "Enter a brand name and URL. The profile agent reads the site and structures audience, voice, products, and positioning.",
    tag: "profile · shared context",
    live: true,
  },
  {
    n: "02",
    title: "Run specialist agents",
    desc: "Trigger Research, Market News, Outreach, Competitor, or Content Studio—each grounded in live search tools and your active profile.",
    tag: "web search + scrape",
    live: false,
  },
  {
    n: "03",
    title: "Review & ship deliverables",
    desc: "Inspect findings, verified source pills, strategy actions, and ready-to-send sequences inside one clean workspace shell.",
    tag: "sqlite + local cache",
    live: false,
  },
];

const SPECS = [
  { k: "Frontend", v: "Next.js 16 · App Router · React 19" },
  { k: "Backend", v: "FastAPI · Agent Orchestration" },
  { k: "Persistence", v: "SQLite DB + Browser localStorage" },
  { k: "Verification", v: "11-domain allowlist + source citations" },
  { k: "Offline Mode", v: "Built-in mock runner when API is down" },
];

function LandInner() {
  const { workspaces } = useWorkspaces();
  const { user } = useAuthUser();

  return (
    <div className="land-page">
      <LandNav />

      <main>
        <header className="land-hero">
          <h1 className="land-title">
            Your agency’s research floor,
            <span> engineered as an OS.</span>
          </h1>

          <div className="land-hero-split">
            <p className="land-sub">
              Six specialist AI agents unified around one client workspace
              profile—turning market research, verified news sweeps, prospect
              outreach, competitor teardowns, and campaign drafting into
              structured workflows.
            </p>

            <div className="land-hero-actions">
              <div className="land-cta-row">
                {user ? (
                  <>
                    <Link href="/dashboard" className="run land-btn-main">
                      Open the OS <span aria-hidden="true">→</span>
                    </Link>
                    <Link href="/workspaces" className="run land-btn-ghost">
                      Switch workspace
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup" className="run land-btn-main">
                      Get started — sign up free <span aria-hidden="true">→</span>
                    </Link>
                    <Link href="/login" className="run land-btn-ghost">
                      Log in
                    </Link>
                  </>
                )}
              </div>
              <p className="land-hero-meta">
                Self-hosted on Next.js + FastAPI + SQLite · Mock-ready out of the box
              </p>
            </div>
          </div>
        </header>

        <section id="preview" className="land-preview-sec" aria-label="Interactive OS preview">
          <LandPreview />
        </section>

        <section className="land-signals-sec" aria-label="Operating system metrics">
          <div className="land-signals">
            {SIGNALS.map((s) => (
              <div className="land-signal" key={s.label}>
                <span className="land-signal-num">{s.n}</span>
                <strong>{s.label}</strong>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="agents" className="land-section">
          <div className="land-sec-head">
            <p className="kicker land-kicker">
              <sup>(01)</sup> The Agent Floor
            </p>
            <h2 className="land-h2">
              Six focused modules. Zero tab graveyard.
            </h2>
          </div>

          <div className="land-bento">
            <Link href="/research" className="land-bento-card land-bento-lead">
              <div className="land-bento-top">
                <span className="land-bento-ico">
                  <Streamline icon={networkSearch} size={18} />
                </span>
                <span className="land-bento-code">01 / RESEARCH &amp; STRATEGY</span>
                <span className="land-bento-arrow" aria-hidden="true">↗</span>
              </div>
              <h3>Sourced intelligence paired with an executive playbook.</h3>
              <p>
                Choose Quick, Standard, or Deep depth. Receive structured
                findings backed by citations alongside prioritized
                recommendations, quick wins, and long-term plays.
              </p>
              <div className="land-bento-chips">
                <span>Quick / Standard / Deep</span>
                <span>Executive Summary</span>
                <span>Cited Sources</span>
                <span>Strategy Playbook</span>
              </div>
            </Link>

            <Link href="/outreach" className="land-bento-card land-bento-span2">
              <div className="land-bento-top">
                <span className="land-bento-ico">
                  <Streamline icon={sendEmailFly} size={18} />
                </span>
                <span className="land-bento-code">02 / OUTREACH</span>
                <span className="land-bento-arrow" aria-hidden="true">↗</span>
              </div>
              <h3>Prospect analysis to cold sequence.</h3>
              <p>
                Point at a prospect’s URL to extract positioning gaps, pain
                points, subject lines, a cold email, and two follow-ups.
              </p>
              <div className="land-bento-chips">
                <span>Pain Diagnosis</span>
                <span>3-Email Sequence</span>
              </div>
            </Link>

            <Link href="/news" className="land-bento-card land-bento-span2">
              <div className="land-bento-top">
                <span className="land-bento-ico">
                  <Streamline icon={newspaperFold} size={18} />
                </span>
                <span className="land-bento-code">03 / MARKET NEWS</span>
                <span className="land-bento-arrow" aria-hidden="true">↗</span>
              </div>
              <h3>Live signals from verified outlets only.</h3>
              <p>
                Domain-restricted news sweep across 11 trusted sources,
                synthesized into categorized articles, trends, and opportunities.
              </p>
              <div className="land-bento-chips">
                <span>11 Trusted Domains</span>
                <span>Trend Radar</span>
              </div>
            </Link>

            <Link href="/competitor" className="land-bento-card land-bento-span2">
              <div className="land-bento-top">
                <span className="land-bento-ico">
                  <Streamline icon={dataTransferDiagonal1} size={18} />
                </span>
                <span className="land-bento-code">04 / COMPETITOR</span>
                <span className="land-bento-arrow" aria-hidden="true">↗</span>
              </div>
              <h3>Instant competitive teardowns.</h3>
              <p>
                Analyze any rival website for market position, differentiators,
                strengths, weaknesses, and a recommended counter-strategy.
              </p>
              <div className="land-bento-chips">
                <span>SWOT Snapshot</span>
                <span>Counter-Strategy</span>
              </div>
            </Link>

            <Link href="/studio" className="land-bento-card land-bento-span2">
              <div className="land-bento-top">
                <span className="land-bento-ico">
                  <Streamline icon={pencil1} size={18} />
                </span>
                <span className="land-bento-code">05 / CONTENT STUDIO</span>
                <span className="land-bento-arrow" aria-hidden="true">↗</span>
              </div>
              <h3>Brand-aware campaign drafting.</h3>
              <p>
                Chat directly with a strategist grounded in your workspace
                profile to plan campaigns and generate copy, social posts, and CTAs.
              </p>
              <div className="land-bento-chips">
                <span>Conversational</span>
                <span>Copy &amp; Social Assets</span>
              </div>
            </Link>

            <Link href="/profile" className="land-bento-card land-bento-wide">
              <div className="land-bento-wide-copy">
                <div className="land-bento-top">
                  <span className="land-bento-ico">
                    <Streamline icon={businessCard1} size={18} />
                  </span>
                  <span className="land-bento-code">00 / COMPANY PROFILE · SHARED FOUNDATION</span>
                  <span className="land-bento-arrow" aria-hidden="true">↗</span>
                </div>
                <h3>Set the client profile once. Power every agent automatically.</h3>
                <p>
                  Every workspace extracts and stores structured company context so
                  research, news, outreach, competitor analysis, and content stay
                  aligned without re-prompting.
                </p>
              </div>
              <div className="land-bento-schema" aria-hidden="true">
                <span>Brand Voice</span>
                <span>Target Audience</span>
                <span>Value Proposition</span>
                <span>Products &amp; Services</span>
                <span>Keywords</span>
                <span>Company Summary</span>
              </div>
            </Link>
          </div>
        </section>

        <section id="workflow" className="land-section">
          <div className="land-sec-head">
            <p className="kicker land-kicker">
              <sup>(02)</sup> Execution Loop
            </p>
            <h2 className="land-h2">
              Three clean steps from client URL to deliverables.
            </h2>
          </div>

          <div className="land-pipeline">
            {STEPS.map((st) => (
              <div className="land-pipe-step" key={st.n}>
                <div className="land-pipe-top">
                  <span className={`land-pipe-num ${st.live ? "live" : ""}`}>
                    {st.n}
                  </span>
                  <span className="land-pipe-tag">{st.tag}</span>
                </div>
                <h3>{st.title}</h3>
                <p>{st.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="stack" className="land-section">
          <div className="land-stack-grid">
            <div className="land-stack-copy">
              <p className="kicker land-kicker">
                <sup>(03)</sup> System Architecture
              </p>
              <h2 className="land-h2">
                Full-stack local control. Built-in mock fallback.
              </h2>
              <p className="land-stack-p">
                AI Agency OS keeps client profiles, agent runs, and chat
                history on your own infrastructure—combining a fast Next.js
                workspace shell with FastAPI agent pipelines and SQLite storage.
                When the backend is offline, every module seamlessly falls back
                to deterministic mock runs so you can inspect workflows anytime.
              </p>
            </div>

            <div className="land-spec-card">
              <div className="land-spec-head">
                <span className="land-pulse-dot" aria-hidden="true" />
                <span>SYSTEM MANIFEST</span>
              </div>
              <dl className="land-spec-list">
                {SPECS.map((row) => (
                  <div className="land-spec-row" key={row.k}>
                    <dt>{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="land-closing">
          <div className="land-closing-card">
            <div className="land-closing-copy">
              <span className="land-closing-kicker">READY WHEN YOU ARE</span>
              <h2>Put six specialist agents on your agency floor.</h2>
              <p>
                Create a client workspace and run your first sourced brief in
                minutes.
              </p>
            </div>
            <Link href={user ? "/dashboard" : "/signup"} className="land-closing-btn">
              {user ? "Open the OS" : "Sign up free"} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="land-footer">
        <div className="land-footer-brand">
          <strong>AI Agency OS</strong>
          <span>Full-stack marketing agency operating system</span>
        </div>
        <div className="land-footer-links">
          <a href="#preview">Preview</a>
          <a href="#agents">Agents</a>
          <a href="#workflow">Workflow</a>
          <Link href={user ? "/dashboard" : "/signup"}>
            {user ? "Open the OS" : "Sign up free"}
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <WorkspaceProvider>
      <LandInner />
    </WorkspaceProvider>
  );
}
