"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PANEL_POINTS = [
  { n: "01", t: "Six specialist agents", d: "Research, news, outreach, competitor, profile and studio — one pass each." },
  { n: "02", t: "11 verified sources", d: "Reuters, BBC, NIST, IAB, WARC — sourced intelligence only, no hallucinations." },
  { n: "03", t: "One OS for every client", d: "Workspaces keep each client's profile, reports and chat separate." },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const next = params.get("next") || "/dashboard";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your inbox — confirm your email to activate your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-panel" aria-hidden="true">
        <div className="auth-panel-brand">
          <span className="brand-mark">A</span>
          <strong>AI Agency OS</strong>
        </div>

        <div className="auth-panel-copy">
          <h2>
            The research floor of your agency,
            <em> running itself .</em>
          </h2>
        </div>

        <ul className="auth-panel-list">
          {PANEL_POINTS.map((p) => (
            <li key={p.n}>
              <span className="auth-panel-n">{p.n}</span>
              <div>
                <strong>{p.t}</strong>
                <span>{p.d}</span>
              </div>
            </li>
          ))}
        </ul>

        <p className="auth-panel-foot">runs entirely on your own stack.</p>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={submit} noValidate={false}>
          <p className="kicker auth-kicker">
            <sup>({mode === "login" ? "01" : "02"})</sup>{" "}
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          <h1>{mode === "login" ? "Sign in to the OS" : "Get your agents working"}</h1>
          <p className="auth-sub">
            {mode === "login"
              ? "Pick up where your last report left off."
              : "One account. Every client workspace. Free to start."}
          </p>

          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="auth-notice" role="status">
              {notice}
            </p>
          )}

          <button className="run auth-btn" disabled={busy}>
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
            <span aria-hidden="true">→</span>
          </button>

          <p className="auth-switch">
            {mode === "login" ? (
              <>
                New here? <Link href="/signup">Create an account</Link>
              </>
            ) : (
              <>
                Already onboard? <Link href="/login">Sign in</Link>
              </>
            )}
          </p>

          <Link href="/" className="auth-back">
            ← Back to the site
          </Link>
        </form>
      </main>
    </div>
  );
}
