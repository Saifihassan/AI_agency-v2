"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function LandNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 39, y: 39 });
  const [scrolled, setScrolled] = useState(false);

  function setMenuWatch() {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    setMenuWatch();
  }, [open]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <>
      <nav className={`land-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="land-nav-inner">
          <Link href="/" className="land-brand">
            <span className="brand-mark">A</span>
            <strong>AI Agency OS</strong>
            <em>v2</em>
          </Link>
          <div className="land-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
                {l.label}
              </Link>
            ))}
            <Link href="/dashboard" className="land-cta">
              Open the OS
            </Link>
          </div>
          <button
            className="menu-btn land-menu-btn"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
              setOpen(true);
            }}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div
        className={`menu-screen ${open ? "open" : ""}`}
        style={{
          ["--ox" as string]: `${origin.x}px`,
          ["--oy" as string]: `${origin.y}px`,
        }}
      >
        <button
          className="menu-close"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <div className="menu-inner">
          <div className="land-menu-brand">
            <span className="brand-mark">A</span>
            <div className="brand-text">
              <strong>AI Agency OS</strong>
              <span>v2 · full-stack</span>
            </div>
          </div>
          <nav className="land-menu-links">
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={`menu-fade ${path === l.href ? "active" : ""}`}
                style={{ ["--i" as string]: i + 1 }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
