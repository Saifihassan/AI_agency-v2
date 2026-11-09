"use client";

import { useEffect, useRef, useState } from "react";
import { apiMode, apiConnected, runModule } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { Kicker, Reveal } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";
import { Streamline, pencil1 } from "@/components/icons";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const starters = [
  "Give me 3 LinkedIn posts for our audience this week",
  "Write a launch email for our core offer",
  "Plan a 2-week campaign for lead generation",
  "Rewrite our homepage tagline sharper",
];

export default function StudioPage() {
  const { active, bumpUsage } = useWorkspaces();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiConnected() || !active) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/studio/${active.id}/history`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { role: string; content: string; response_type: string }[]) =>
        setMessages(
          rows.map((r) => ({
            id: uid(),
            role: r.role === "user" ? "user" : "assistant",
            content: r.content,
            response_type:
              r.role === "user"
                ? "chat"
                : r.response_type === "content_post"
                  ? "content_post"
                  : "chat",
          })),
        ),
      )
      .catch(() => {});
  }, [active?.id]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!body || running) return;
    const history = messages
      .filter((m) => m.response_type !== "pending" && m.response_type !== "error")
      .map((m) => ({ role: m.role, content: m.content }));
    setUserMsg(body);
    setInput("");
    setRunning(true);
    const pendingId = uid();
    setMessages((prev) => [
      ...prev,
      { id: pendingId, role: "assistant", content: "", response_type: "pending" },
    ]);
    try {
      const res = await runModule("studio", {
        message: body,
        history,
        workspace_id: active?.id ?? null,
      });
      bumpUsage("Content Studio");
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== pendingId),
        {
          id: uid(),
          role: "assistant",
          content: res.message,
          response_type: res.response_type,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== pendingId),
        { id: uid(), role: "assistant", content: "Run failed. Try again.", response_type: "error" },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const setUserMsg = (content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.response_type === "pending") return prev;
      return [...prev, { id: uid(), role: "user", content, response_type: "chat" }];
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const empty = messages.length === 0;

  return (
    <>
      <Reveal>
        <div className="page-head">
          <h1>Content Studio</h1>
          <Kicker>
            <sup>(01)</sup>Chat with the manager agent. It plans campaigns and
            writes copy from your workspace profile.
          </Kicker>
        </div>
      </Reveal>

      <Reveal i={1}>
        <div className="chat-wrap">
          <div className="chat-top">
            <span className="section-label" style={{ display: "inline-flex" }}>
              <Streamline icon={pencil1} size={13} /> Studio session
              {active ? ` — ${active.name}` : ""}
            </span>
            {messages.length > 0 && (
              <button className="link-btn" onClick={() => setMessages([])}>
                Clear session
              </button>
            )}
          </div>

          <div className="chat-log" ref={logRef}>
            {empty && (
              <div className="chat-empty">
                <p className="kicker">START THE CONVERSATION</p>
                <div className="subjects" style={{ marginTop: 10, textAlign: "left" }}>
                  {starters.map((s) => (
                    <span key={s} style={{ cursor: "pointer" }} onClick={() => void send(s)}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-row ${m.role === "user" ? "chat-user" : "chat-ai"}`}
              >
                <span className="chat-label">
                  {m.role === "user" ? "YOU" : m.response_type === "content_post" ? "DELIVERABLE" : "STUDIO"}
                </span>
                {m.response_type === "pending" ? (
                  <span className="chat-typing" aria-label="agent is typing">
                    <i /><i /><i />
                  </span>
                ) : m.role === "user" ? (
                  <p className="chat-text">{m.content}</p>
                ) : m.response_type === "content_post" ? (
                  <div className="panel copy-block chat-copy">{m.content}</div>
                ) : (
                  <p className="chat-text chat-text-ai">{m.content}</p>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={running ? "Studio is working…" : "Message the studio…"}
              disabled={running}
            />
            <button
              className="run chat-send"
              disabled={running || !input.trim()}
              onClick={() => void send(input)}
            >
              {running ? "Working…" : "Send"}
            </button>
          </div>
          <div className="runbar" style={{ padding: "8px 14px" }}>
            {apiMode()}
          </div>
        </div>
      </Reveal>
    </>
  );
}
