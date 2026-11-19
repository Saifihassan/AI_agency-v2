import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ModelPicker } from "./modelpicker";

export function Reveal({
  children,
  i = 0,
}: {
  children: ReactNode;
  i?: number;
}) {
  return (
    <div style={{ ["--i" as string]: i }}>
      <div className="reveal">{children}</div>
    </div>
  );
}

export function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      setDisplay(value);
      return;
    }
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export function Panel({
  title,
  children,
  tight,
}: {
  title?: string;
  children: ReactNode;
  tight?: boolean;
}) {
  return (
    <section className={tight ? "panel tight" : "panel"}>
      {title && <h3 className="panel-title">{title}</h3>}
      {children}
    </section>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>;
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2 className="section-label">
      <sup>({n})</sup> {children}
    </h2>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function BaseItems({ items }: { items: string[] }) {
  return (
    <ul className="base-list">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export function RunBar({
  running,
  mode,
  module,
}: {
  running: boolean;
  mode: string;
  module?: string;
}) {
  return (
    <div className="runbar">
      <span className={running ? "status running" : "status idle"}>
        {running ? "agents working" : "idle"}
      </span>
      <div className="runbar-right">
        {module && <ModelPicker module={module} />}
        <span className="mode">{mode}</span>
      </div>
    </div>
  );
}

export function ErrorNote({ msg }: { msg: string }) {
  return <div className="error-note">{msg}</div>;
}
