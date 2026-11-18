"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/lib/supabase/useauth";

const SECTIONS = [
  { href: "#preview", label: "Preview" },
  { href: "#agents", label: "Agents" },
  { href: "#workflow", label: "Workflow" },
  { href: "#stack", label: "Stack" },
];

export default function LandNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 39, y: 39 });
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuthUser();

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <>
      <header className={`land-nav-wrap ${scrolled ? "scrolled" : ""}`}>
        <nav className="land-nav" aria-label="Landing navigation">
          <Link href="/" className="land-brand">
            <span className="brand-mark">A</span>
            <strong>AI Agency OS</strong>
          </Link>

          <div className="land-anchors">
            {SECTIONS.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="land-nav-actions">
            {user ? (
              <Link href="/dashboard" className="land-cta">
                Open the OS <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="land-login">
                  Log in
                </Link>
                <Link href="/signup" className="land-cta">
                  Sign up free <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
            <button
              type="button"
              className="menu-btn land-menu-btn"
              aria-label="Open navigation menu"
              aria-expanded={open}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
                setOpen(true);
              }}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`menu-screen ${open ? "open" : ""}`}
        style={{
          ["--ox" as string]: `${origin.x}px`,
          ["--oy" as string]: `${origin.y}px`,
        }}
      >
        <button
          type="button"
          className="menu-close"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <div className="menu-inner">
          <div className="land-menu-brand">
            <span className="brand-mark">A</span>
            <div className="brand-text">
              <strong>AI Agency OS</strong>
              <span>full-stack</span>
            </div>
          </div>
          <nav className="land-menu-links" aria-label="Mobile navigation">
            {SECTIONS.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                className="menu-fade"
                style={{ ["--i" as string]: i + 1 }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="menu-fade land-menu-cta"
              style={{ ["--i" as string]: SECTIONS.length + 1 }}
              onClick={() => setOpen(false)}
            >
              {user ? "Open the OS →" : "Sign up free →"}
            </Link>
            {!user && (
              <Link
                href="/login"
                className="menu-fade land-menu-cta land-menu-cta-ghost"
                style={{ ["--i" as string]: SECTIONS.length + 2 }}
                onClick={() => setOpen(false)}
              >
                Log in →
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
