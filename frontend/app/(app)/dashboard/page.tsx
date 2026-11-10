"use client";

import Link from "next/link";
import { Counter, Reveal } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";
import {
  Streamline,
  layoutDashboard1,
  pencil1,
  networkSearch,
  newspaperFold,
  sendEmailFly,
  dataTransferDiagonal1,
  plusOneIncrement,
  type StreamlineIcon,
} from "@/components/icons";

const MODULES: {
  href: string;
  icon: StreamlineIcon;
  title: string;
  desc: string;
  usageKey: string;
}[] = [
  {
    href: "/studio",
    icon: pencil1,
    title: "Content Studio",
    desc: "Plan a campaign with a researcher-augmented agent, then generate full assets.",
    usageKey: "Content Studio",
  },
  {
    href: "/research",
    icon: networkSearch,
    title: "Research",
    desc: "Deep market research → structured findings and a strategy report.",
    usageKey: "Research",
  },
  {
    href: "/news",
    icon: newspaperFold,
    title: "Market News",
    desc: "Live news pipeline: headlines, trends and opportunities for your niche.",
    usageKey: "Market News",
  },
  {
    href: "/outreach",
    icon: sendEmailFly,
    title: "Outreach",
    desc: "Analyze a prospect's site and generate a full cold-DM sequence.",
    usageKey: "Outreach",
  },
  {
    href: "/competitor",
    icon: dataTransferDiagonal1,
    title: "Competitor",
    desc: "SWOT-style breakdown of any competitor from their website alone.",
    usageKey: "Competitor",
  },
  {
    href: "/workspaces",
    icon: plusOneIncrement,
    title: "Workspaces",
    desc: "Create a client workspace — the profile that powers every agent.",
    usageKey: "Workspaces",
  },
];

export default function Dashboard() {
  const { active, usage, recent } = useWorkspaces();

  const runs = Object.values(usage).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="page-head">
        <Reveal>
          <h1>
            {active ? active.name : "Create your first workspace"}
            {active?.industry ? <em style={{ fontStyle: "normal", color: "var(--accent)" }}> · {active.industry}</em> : null}
          </h1>
        </Reveal>
        <Reveal i={1}>
          <p className="kicker">
            <sup>AGENCY OS</sup>
            Your AI marketing department — every module reads the active
            workspace profile.
          </p>
        </Reveal>
      </div>

      <div className="stat-strip">
        {[
          { label: "Active workspace", show: <Counter value={active ? 1 : 0} /> },
          { label: "Agent runs", show: <Counter value={runs} /> },
          { label: "Modules in use", show: <Counter value={recent.length} /> },
        ].map((s, i) => (
          <div className="stat-card reveal" style={{ ["--i" as string]: i }} key={s.label}>
            <div className="num">{s.show}</div>
            <div className="lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mod-grid" style={{ marginTop: "var(--space-4)" }}>
        {MODULES.map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            className="mod-card reveal"
            style={{ ["--i" as string]: i + 3 }}
          >
            <span className="ico"><Streamline icon={m.icon} size={17} /></span>
            <h3>
              {m.title}
              {usage[m.usageKey] ? <em>{usage[m.usageKey]} runs</em> : null}
            </h3>
            <p>{m.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
