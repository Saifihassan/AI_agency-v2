"use client";

import Link from "next/link";
import { useWorkspaces, WorkspaceProvider } from "@/components/workspace";
import LandNav from "@/components/landnav";

const STATS = [
  { n: "~3 min", t: "per sourced intelligence report", d: "Research that used to eat an afternoon now runs itself." },
  { n: "6", t: "specialist agents on the floor", d: "Research, market news, outreach, competitor, content, profile." },
  { n: "11", t: "verified sources only", d: "Every headline is traceable to a trusted domain or it doesn't ship." },
  { n: "1 click", t: "from brief to outreach", d: "Prospect analysis plus a full email sequence, ready to send." },
];

const MODULES = [
  { href: "/research", k: "(02)", t: "Research", d: "Drop a topic, pick a depth, get a sourced report plus a strategy playbook. What took full days now unfolds while you keep working." },
  { href: "/news", k: "(03)", t: "Market News", d: "A live intelligence report from trusted outlets — trends, opportunities, headlines — without opening a single tab of news." },
  { href: "/outreach", k: "(04)", t: "Outreach", d: "Point at a prospect's website. The agent reads it, finds the pain, and writes a sequence you'd actually reply to." },
  { href: "/competitor", k: "(05)", t: "Competitor", d: "A full teardown of any competitor — snapshot, strengths, gaps, and an attack plan — in the time it takes to make coffee." },
  { href: "/studio", k: "(06)", t: "Content Studio", d: "Chat with an agent that knows the whole company profile and writes deliverables in it." },
  { href: "/profile", k: "(00)", t: "Company Profile", d: "One setup pass builds the profile every other agent runs on — set it once, benefit everywhere." },
];

const STEPS = [
  { n: "01", t: "Create a workspace", d: "Paste your client's URL. The profile agent reads the site and builds the company profile in seconds." },
  { n: "02", t: "Agents run their pass", d: "Research, news and outreach agents work with live web tools — searching, reading, summarizing with sources." },
  { n: "03", t: "Act on intelligence", d: "Tabs, sources and strategy. Copy, plan or ship it straight from the OS window." },
];

function LandInner() {
  const { workspaces } = useWorkspaces();

  return (
    <div className="land-page">
      <LandNav />

      <header className="land-hero">
        <div className="land-hero-copy">
          <p className="kicker land-kicker"><sup>(01)</sup> An operating system for marketing agencies</p>
          <h1>
            The research floor of your agency,
            <em className="land-accent-word"> running itself .</em>
          </h1>
          <p className="land-sub">
            AI Agency OS v2 puts six agents on your team — researching, writing
            and monitoring value — attaching them as little 30-minute
            add-ons to your day.
          </p>
          <div className="land-cta-row">
            <Link href="/dashboard" className="run land-btn-main">Open the OS</Link>
            <Link href="/workspaces" className="run land-btn-ghost">
              {workspaces.length > 0 ? "Continue in your workspace" : "Create your first workspace"}
            </Link>
          </div>
          <p className="land-hero-foot">
            runs entirely on your own stack — Next.js + FastAPI + SQLite.
          </p>
        </div>

        <div className="land-hero-card" aria-hidden="true">
          <div className="land-hero-card-top">
            <span className="dot ok" /><span className="report-mini-label">verified sources</span>
          </div>
          <h3 className="report-shade-h">Industry intelligence</h3>
          <div className="land-hero-lines">
            <span />
            <span style={{ width: "84%" }} />
            <span style={{ width: "70%" }} />
          </div>
          <div className="land-hero-chips">
            <span>Reuters</span>
            <span>BBC</span>
            <span>NIST</span>
            <span>Think with Google</span>
            <span>IAB</span>
            <span>WARC</span>
          </div>
          <p className="land-hero-time">generated in 3m 12s</p>
        </div>
      </header>

      <section className="land-stats">
        {STATS.map((s) => (
          <div className="land-stat" key={s.t}>
            <strong>{s.n}</strong>
            <span>{s.t}</span>
            <p>{s.d}</p>
          </div>
        ))}
      </section>

      <section className="land-modules">
        <p className="kicker land-kicker"><sup>(02)</sup> What the agents take off your plate</p>
        <h2 className="land-h2">Hours of manual work, turned into executive minutes.</h2>
        <div className="land-mod-grid">
          {MODULES.map((m) => (
            <Link href={m.href} className="land-mod" key={m.href}>
              <span className="land-mod-k">{m.k}</span>
              <h3>{m.t}</h3>
              <p>{m.d}</p>
              <span className="land-mod-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="land-how">
        <p className="kicker land-kicker"><sup>(03)</sup> How it saves the time</p>
        <h2 className="land-h2">Three steps. No research tab graveyard.</h2>
        <div className="land-steps">
          {STEPS.map((st) => (
            <div className="land-step" key={st.n}>
              <span className="land-step-num">{st.n}</span>
              <h3>{st.t}</h3>
              <p>{st.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-band">
        <div className="land-band-inner">
          <h2>Stop researching. Start shipping.</h2>
          <p>Open the OS, drop a workspace, and watch the floor work.</p>
          <Link href="/dashboard" className="run land-band-btn">Open the OS</Link>
        </div>
      </section>

      <footer className="land-footer">
        <span>AI Agency OS v2</span>
        <span>full-stack · Next.js + FastAPI</span>
        <Link href="/settings">Settings</Link>
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