"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Streamline,
  networkSearch,
  newspaperFold,
  sendEmailFly,
  dataTransferDiagonal1,
  pencil1,
  businessCard1,
  type StreamlineIcon,
} from "./icons";

type ModuleId = "research" | "news" | "outreach" | "competitor" | "studio" | "profile";

type PreviewModule = {
  id: ModuleId;
  label: string;
  href: string;
  icon: StreamlineIcon;
  path: string;
  badge: string;
  title: string;
  summary: string;
  highlights: { label: string; text: string }[];
  tags: string[];
};

const MODULES: PreviewModule[] = [
  {
    id: "research",
    label: "Research",
    href: "/research",
    icon: networkSearch,
    path: "os://acme-cloud/research",
    badge: "Deep · Sourced + Strategy",
    title: "B2B DevTools Buyer Shift in 2026",
    summary:
      "Self-serve evaluation now precedes 74% of enterprise security reviews. Positioning around verifiable audit logs shortens procurement cycles.",
    highlights: [
      {
        label: "Finding 01",
        text: "Engineering leads shortlist vendors with transparent SOC2 & latency benchmarks before booking calls.",
      },
      {
        label: "Strategy Quick Win",
        text: "Publish interactive architecture teardown pages targeting compliance-sensitive mid-market teams.",
      },
    ],
    tags: ["Reuters", "NIST", "WARC", "Think with Google"],
  },
  {
    id: "news",
    label: "Market News",
    href: "/news",
    icon: newspaperFold,
    path: "os://acme-cloud/news",
    badge: "11 Allowlisted Domains",
    title: "Weekly Industry Intelligence Brief",
    summary:
      "Automated multi-outlet sweep filtered strictly to verified publications—surfacing categorized headlines, market shifts, and campaign angles.",
    highlights: [
      {
        label: "Trend Signal",
        text: "Enterprise AI governance standards accelerate demand for auditable workflow tooling across EU & US.",
      },
      {
        label: "Opportunity",
        text: "Launch a comparative compliance checklist ahead of Q3 procurement budget resets.",
      },
    ],
    tags: ["reuters.com", "bbc.com", "spectrum.ieee.org", "iab.com"],
  },
  {
    id: "outreach",
    label: "Outreach",
    href: "/outreach",
    icon: sendEmailFly,
    path: "os://acme-cloud/outreach",
    badge: "Prospect + 3-Step Sequence",
    title: "Northstar Logistics · Prospect Teardown",
    summary:
      "Crawled target site to diagnose messaging gaps, extracted pain points, and drafted a cold email plus two tailored follow-ups.",
    highlights: [
      {
        label: "Identified Pain",
        text: "Generic onboarding flow hides enterprise API reliability guarantees from technical buyers.",
      },
      {
        label: "Cold Subject",
        text: "Quick question on Northstar’s API onboarding drop-off",
      },
    ],
    tags: ["Pain Diagnosis", "Cold Email", "Follow-up #1", "Follow-up #2"],
  },
  {
    id: "competitor",
    label: "Competitor",
    href: "/competitor",
    icon: dataTransferDiagonal1,
    path: "os://acme-cloud/competitor",
    badge: "SWOT + Counter-Play",
    title: "Vanguard Ops · Competitive Breakdown",
    summary:
      "Full positioning snapshot built directly from competitor web presence—exposing core differentiators, blind spots, and wedge opportunities.",
    highlights: [
      {
        label: "Weakness Exposed",
        text: "Heavy multi-week setup messaging alienates lean growth teams seeking same-day deployment.",
      },
      {
        label: "Counter-Strategy",
        text: "Anchor comparison landing pages on zero-config onboarding and transparent flat-tier pricing.",
      },
    ],
    tags: ["Snapshot", "Strengths", "Weaknesses", "Attack Plan"],
  },
  {
    id: "studio",
    label: "Content Studio",
    href: "/studio",
    icon: pencil1,
    path: "os://acme-cloud/studio",
    badge: "Profile-Aware Chat",
    title: "Q3 Product Launch Campaign Draft",
    summary:
      "Conversational strategist that inherits your active client brand voice, audience, and selling points to ship ready-to-publish copy.",
    highlights: [
      {
        label: "Campaign Angle",
        text: "Lead with measurable engineering hours saved rather than generic AI automation claims.",
      },
      {
        label: "Deliverable",
        text: "LinkedIn launch thread, landing hero variants, and 3 high-intent CTA hooks generated.",
      },
    ],
    tags: ["LinkedIn Copy", "Email Asset", "CTA Hooks", "On-Voice"],
  },
  {
    id: "profile",
    label: "Company Profile",
    href: "/profile",
    icon: businessCard1,
    path: "os://acme-cloud/profile",
    badge: "Shared Context Layer",
    title: "Acme Cloud · Active Workspace Profile",
    summary:
      "Set up once from a client URL. Every agent across the OS automatically pulls this profile so outputs never drift off-brand.",
    highlights: [
      {
        label: "Brand Voice",
        text: "Direct, technical, evidence-backed — zero hype adjectives.",
      },
      {
        label: "Target Audience",
        text: "VP Engineering & RevOps leaders at 50–500 person B2B software companies.",
      },
    ],
    tags: ["Value Prop", "Products", "Audience", "Keywords"],
  },
];

export default function LandPreview() {
  const [activeId, setActiveId] = useState<ModuleId>("research");
  const current = MODULES.find((m) => m.id === activeId) ?? MODULES[0];

  return (
    <div className="land-os-frame">
      <div className="land-os-topbar">
        <div className="land-os-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="land-os-address">{current.path}</div>
        <div className="land-os-live">
          <span className="land-pulse-dot" aria-hidden="true" />
          <span>6 agents online</span>
        </div>
      </div>

      <div className="land-os-body">
        <aside className="land-os-rail" aria-label="OS module preview selector">
          <div className="land-os-ws">
            <span className="land-pulse-dot" aria-hidden="true" />
            <div>
              <small>Active workspace</small>
              <strong>Acme Cloud</strong>
            </div>
          </div>

          <div className="land-os-tabs" role="tablist" aria-label="Agent modules">
            {MODULES.map((mod) => {
              const selected = mod.id === current.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`land-os-tab ${selected ? "active" : ""}`}
                  onClick={() => setActiveId(mod.id)}
                >
                  <Streamline icon={mod.icon} size={15} />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </div>

          <div className="land-os-rail-foot">
            <span>shared profile context</span>
          </div>
        </aside>

        <div className="land-os-canvas" role="tabpanel" aria-label={`${current.label} preview`}>
          <div className="land-os-canvas-head">
            <div>
              <span className="land-os-badge">{current.badge}</span>
              <h3>{current.title}</h3>
            </div>
            <Link href={current.href} className="land-os-open">
              Open {current.label} <span aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="land-os-summary">{current.summary}</p>

          <div className="land-os-cards">
            {current.highlights.map((item) => (
              <div className="land-os-card" key={item.label}>
                <span className="land-os-card-k">{item.label}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="land-os-tags">
            {current.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

