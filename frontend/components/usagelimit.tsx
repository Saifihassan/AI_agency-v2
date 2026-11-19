"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { UsageLimitDetail } from "@/lib/api";

const MODULE_LABELS: Record<string, string> = {
  research: "Research",
  news: "Market News",
  outreach: "Outreach",
  competitor: "Competitor",
  studio: "Content Studio",
  workspace: "Workspace setup",
};

function formatReset(resetAt: string | null): string | null {
  if (!resetAt) return null;
  const date = new Date(resetAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function UsageLimitModal() {
  const [detail, setDetail] = useState<UsageLimitDetail | null>(null);

  useEffect(() => {
    const onLimit = (e: Event) => {
      const custom = e as CustomEvent<UsageLimitDetail>;
      if (custom.detail?.code === "usage_limit") setDetail(custom.detail);
    };
    window.addEventListener("agencyos:usage-limit", onLimit);
    return () => window.removeEventListener("agencyos:usage-limit", onLimit);
  }, []);

  useEffect(() => {
    if (!detail) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [detail]);

  if (!detail) return null;

  const label = MODULE_LABELS[detail.module] ?? detail.module;
  const reset = formatReset(detail.reset_at);

  return (
    <div
      className="limit-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setDetail(null);
      }}
    >
      <div className="limit-card">
        <span className="limit-badge" aria-hidden="true">3 / 3</span>
        <h2 id="limit-title">You&apos;ve used all your {label} runs</h2>
        <p className="limit-copy">
          You get {detail.limit} {label.toLowerCase()} runs every{" "}
          {detail.window_hours} hours on the shared engine. To keep going now,
          connect your own API key — or wait and your quota refills
          automatically{reset ? ` on ${reset}` : ""}.
        </p>
        <div className="limit-actions">
          <Link href="/settings#api-keys" className="run limit-primary" onClick={() => setDetail(null)}>
            Use my own API key
          </Link>
          <button className="limit-secondary" onClick={() => setDetail(null)}>
            I&apos;ll wait for the refill
          </button>
        </div>
        <p className="limit-foot">
          Refills {detail.window_hours}h after each run. Your key stays on your
          own account.
        </p>
      </div>
    </div>
  );
}
