"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaces } from "./workspace";
import { useUsage } from "./usage";
import { useProvider } from "./provider";
import { apiMode } from "@/lib/api";
import {
  Streamline,
  layoutDashboard1,
  pencil1,
  networkSearch,
  newspaperFold,
  sendEmailFly,
  dataTransferDiagonal1,
  businessCard1,
  settingsSliderDesktopHorizontal,
} from "./icons";

const LINKS = [
  { href: "/profile", label: "Profile", icon: businessCard1 },
  { href: "/dashboard", label: "Dashboard", icon: layoutDashboard1 },
  { href: "/studio", label: "Content Studio", icon: pencil1, module: "studio" },
  { href: "/research", label: "Research", icon: networkSearch, module: "research" },
  { href: "/news", label: "Market News", icon: newspaperFold, module: "news" },
  { href: "/outreach", label: "Outreach", icon: sendEmailFly, module: "outreach" },
  { href: "/competitor", label: "Competitor", icon: dataTransferDiagonal1, module: "competitor" },
  { href: "/settings", label: "Settings", icon: settingsSliderDesktopHorizontal },
];

function UserFooter() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    } catch {}
  }, []);

  if (!email) return null;
  return (
    <div className="user-foot">
      <span className="user-email" title={email}>{email}</span>
      <button
        className="user-logout"
        onClick={async () => {
          try {
            await createClient().auth.signOut();
          } catch {}
          router.replace("/login");
          router.refresh();
        }}
      >
        Log out
      </button>
    </div>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const { active, workspaces, setActive } = useWorkspaces();
  const { ready, modules, windowHours } = useUsage();
  const { configured: byok } = useProvider();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 39, y: 39 });
  const firstPath = useRef(path);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".ws-switch")) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (path !== firstPath.current) {
      firstPath.current = path;
      setMenuOpen(false);
    }
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setMenuOpen(true);
  };

  const content = (
    <>
      <div className="brand">
        <span className="brand-mark">A</span>
        <div className="brand-text">
          <strong>AI Agency OS</strong>
          <span>full-stack</span>
        </div>
      </div>

      <div className="ws-switch">
        <button
          className="workspace-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className={`ws-dot ${active ? "ws-dot-live" : ""}`} />
          <div className="ws-text">
            <span className="ws-label">Workspace</span>
            <span className="ws-name">
              {active?.name ?? "None — create one"}
            </span>
          </div>
          <span className={`ws-caret ${open ? "open" : ""}`} />
        </button>

        {open && (
          <div className="ws-menu">
            {workspaces.map((w) => (
              <button
                key={w.id}
                className={`ws-item ${w.id === active?.id ? "ws-active" : ""}`}
                onClick={() => {
                  setActive(w);
                  setOpen(false);
                }}
              >
                <span className={`ws-menu-dot ${w.id === active?.id ? "on" : ""}`} />
                <span className="ws-item-name">{w.name}</span>
                <span className="ws-item-ind">{w.industry || "—"}</span>
              </button>
            ))}
            {workspaces.length === 0 && (
              <span className="ws-item ws-muted">No workspaces yet</span>
            )}
            <Link href="/workspaces" className="ws-item ws-manage" onClick={() => setMenuOpen(false)}>
              Manage workspaces
            </Link>
          </div>
        )}
      </div>

      <nav className="nav menu-nav">
        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`menu-fade ${path === l.href ? "active" : ""}`}
            style={{ ["--i" as string]: i + 1 }}
          >
            <Streamline icon={l.icon} />
            {l.label}
            {l.module && ready && !byok && (
              <span
                className={`usage-badge ${modules[l.module]?.remaining === 0 ? "usage-empty" : ""}`}
                title={
                  modules[l.module]
                    ? `${modules[l.module].remaining} of ${modules[l.module].limit} runs left — refills every ${windowHours}h`
                    : `${l.label} usage`
                }
              >
                {modules[l.module] ? `${modules[l.module].remaining}/${modules[l.module].limit}` : "—"}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="api-status">{apiMode()}</span>
        <UserFooter />
      </div>
    </>
  );

  return (
    <>
      <button
        className="menu-btn"
        aria-label="Open menu"
        aria-expanded={menuOpen}
        onClick={openMenu}
      >
        <span /><span /><span />
      </button>

      <aside className="sidebar">{content}</aside>

      <div
        className={`menu-screen ${menuOpen ? "open" : ""}`}
        style={{
          ["--ox" as string]: `${origin.x}px`,
          ["--oy" as string]: `${origin.y}px`,
        }}
      >
        <button
          className="menu-close"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>
        <div className="menu-inner">{content}</div>
      </div>
    </>
  );
}
