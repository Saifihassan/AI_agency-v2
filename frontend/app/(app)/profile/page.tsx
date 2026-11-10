"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteWorkspace } from "@/lib/api";
import { Empty, Kicker, BaseItems, Reveal } from "@/components/ui";
import { useWorkspaces } from "@/components/workspace";

const TABS = ["Summary", "Commercial", "Services & keywords"] as const;

export default function ProfilePage() {
  const { active, removeWorkspace } = useWorkspaces();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Summary");

  const p = active?.profile;

  const confirmDelete = async () => {
    if (!active || deleting) return;
    setDeleting(true);
    setDeleteError("");
    const ok = await deleteWorkspace(active.id);
    setDeleting(false);
    if (!ok) {
      setDeleteError("Delete failed — check the API and try again.");
      return;
    }
    removeWorkspace(active.id);
    setConfirmOpen(false);
    router.push("/workspaces");
  };

  return (
    <>
      <Reveal>
        <div className="page-head">
          <h1>Profile</h1>
          <Kicker>
            <sup>(00)</sup>The company profile backing every agent run in this
            workspace.
          </Kicker>
        </div>
      </Reveal>

      {!active ? (
        <Reveal i={1}>
          <Empty>
            No workspace selected.{" "}
            <Link href="/workspaces" style={{ textDecoration: "underline" }}>
              Create one
            </Link>{" "}
            and the profile agent will build it.
          </Empty>
        </Reveal>
      ) : !p ? (
        <Reveal i={1}>
          <Empty>
            This workspace has no profile yet — it may have been created in
            mock mode. Create a new workspace to generate a real profile.
          </Empty>
        </Reveal>
      ) : (
        <>
          <Reveal i={1}>
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="report-head">
                <h3 className="profile-name">{p.company_name || active.name}</h3>
              </div>
              <div className="report-meta">
                <span>{active.website || "—"}</span>
                <span>{p.industry || active.industry || "—"}</span>
              </div>
            </div>
          </Reveal>

          <Reveal i={2}>
            <div className="tabs" role="tablist" style={{ marginTop: "var(--space-2)" }}>
              {TABS.map((t, i) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`tab ${tab === t ? "tab-active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t} · 0{i + 1}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal i={3}>
            <div className="tab-view">
              {tab === "Summary" && (
                <div className="panel" style={{ marginTop: 0 }}>
                  <h3 className="panel-title">Business summary</h3>
                  <div className="report-summary plain">{p.company_summary || "—"}</div>
                  <h3 className="panel-title" style={{ marginTop: 18 }}>Description</h3>
                  <p className="profile-body">{p.description || "—"}</p>
                </div>
              )}

              {tab === "Commercial" && (
                <>
                  <h3 className="section-label" style={{ marginBottom: 8 }}>Commercial positioning</h3>
                  <div className="panel" style={{ marginTop: 0 }}>
                    <dl className="kv kv-plain">
                      <dt>Audience</dt><dd>{p.target_audience || "—"}</dd>
                      <dt>Brand voice</dt><dd>{p.brand_voice || "—"}</dd>
                      <dt>Value prop</dt><dd>{p.value_proposition || "—"}</dd>
                    </dl>
                  </div>
                </>
              )}

              {tab === "Services & keywords" && (
                <>
                  <h3 className="section-label" style={{ marginBottom: 8 }}>Products & services</h3>
                  <div className="panel" style={{ marginTop: 0 }}>
                    {(p.products_services ?? []).length > 0 ? (
                      <BaseItems items={p.products_services ?? []} />
                    ) : (
                      <p className="profile-body">—</p>
                    )}
                    {(p.keywords ?? []).length > 0 && (
                      <>
                        <h3 className="panel-title" style={{ marginTop: 18 }}>Keywords</h3>
                        <BaseItems items={p.keywords ?? []} />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </Reveal>

          <Reveal i={4}>
            <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="run danger-run"
                onClick={() => setConfirmOpen(true)}
              >
                Delete this workspace
              </button>
            </div>
          </Reveal>
        </>
      )}

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => !deleting && setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              Delete &ldquo;{active?.name}&rdquo;?
            </h3>
            <p className="modal-text">
              This will delete everything in this workspace — the company
              profile, research reports, competitor analyses, market news,
              outreach sequences and chat history. All data related to it will
              be permanently removed. This can&apos;t be undone.
            </p>
            {deleteError && <div className="error-note" style={{ margin: "10px 0" }}>{deleteError}</div>}
            <div className="modal-actions">
              <button className="run run-ghost" style={{ background: "#fff" }} disabled={deleting} onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="run" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? "Deleting…" : "Delete everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
