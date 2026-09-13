"use client";

import Link from "next/link";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { readContract, type Amendment } from "@/lib/quorumvault";
import { ProposalActions } from "@/components/proposal-actions";
import { statusTone, stageLabel } from "@/lib/contract/status";

const STEPS = ["Filed", "Weighed by validators", "Cleared", "Open to objection", "Installing", "Confirmed installed"];

export function ProposalDetail({ id }: { id: string }) {
  const [proposal, setProposal] = useState<Amendment>();
  const [error, setError] = useState<string>();
  const refresh = useCallback(async () => {
    try { setError(undefined); setProposal(await readContract<Amendment>("get_amendment", [id])); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read this change request."); }
  }, [id]);
  useEffect(() => { void refresh(); }, [refresh]);

  if (error) return <div className="qv-body"><p className="rg-alert">{error}</p><Link className="back-link" href="/amendments">Back to change requests</Link></div>;
  if (!proposal) return <div className="qv-body"><p><LoaderCircle className="spin" /> Reading the chain...</p></div>;

  const stage = String(proposal.stage);
  const weighed = stage !== "PENDING_REVIEW";
  const cleared = ["OBJECTION_WINDOW", "OBJECTED", "INSTALL_PENDING", "INSTALLED"].includes(stage);
  const installing = ["INSTALL_PENDING", "INSTALLED"].includes(stage);
  const stepActive = [true, weighed, cleared, cleared, installing, stage === "INSTALLED"];
  const stopped = ["DENIED", "INCONCLUSIVE", "UNGROUNDED", "WITHDRAWN"].includes(stage);

  let concerns: string[] = [];
  try {
    const parsed = JSON.parse(String(proposal.concerns || "[]"));
    if (Array.isArray(parsed)) concerns = parsed.map(String);
  } catch { /* concerns can arrive as a plain string on some records */ }

  const gates: [string, string][] = [
    ["Storage layout preserved", "layout_preserved"],
    ["Custody preserved", "custody_preserved"],
    ["No asset motion", "no_asset_motion"],
    ["Calls unchanged", "calls_unchanged"],
    ["Policy aligned", "policy_aligned"],
  ];

  return (
    <div className="qv-body" style={{ paddingTop: 40 }}>
      <Link className="back-link" href="/amendments">Back to change requests</Link>
      <p className="eyebrow" style={{ marginTop: 16 }}>Change request</p>
      <h1>{String(proposal.slug)}</h1>
      <p className="lede">{String(proposal.prior_release)} &rarr; {String(proposal.next_release)} <span className={`badge ${statusTone(stage)}`} style={{ marginLeft: 8 }}>{stageLabel(stage)}</span></p>

      <div className="qv-lifecycle" style={{ marginTop: 28 }}>
        <div className="qv-lifecycle-rail">
          {STEPS.map((step, index) => (
            <div key={step} className={stepActive[index] ? "step active" : "step"}>{step}</div>
          ))}
          {stopped && <div className="step active" style={{ color: "var(--alert)" }}>Stopped: {stageLabel(stage)}</div>}
        </div>
        <div className="qv-lifecycle-side">
          <h2 style={{ fontSize: 18, margin: 0 }}>What the validators found</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{String(proposal.notes || "No verdict recorded yet -- this request hasn't been weighed.")}</p>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>Risk score {String(proposal.risk_score ?? "-")} of 100 (needs 35 or lower to clear)</p>
          {concerns.length > 0 && <div className="risk-chips">{concerns.map((flag, i) => <span key={i} className="risk-chip">{flag}</span>)}</div>}
          <div className="gate-grid">
            {gates.map(([label, key]) => {
              const value = proposal[key];
              const unset = value === undefined || value === null || String(value) === "None" || String(value) === "";
              const pass = value === true || String(value).toLowerCase() === "true";
              return <div key={key} className={`gate ${unset ? "" : pass ? "pass" : "fail"}`}><span>{label}</span><span>{unset ? "-" : pass ? "pass" : "fail"}</span></div>;
            })}
          </div>
          {stopped && <p className="qv-branch-note active">A request can also branch into an objection: if someone flags a concern during the objection window, it goes back through the validators once more before clearing or stopping for good.</p>}
        </div>
      </div>

      <div className="detail-grid" style={{ marginTop: 20 }}>
        <article className="rg-card">
          <h2 style={{ fontSize: 18 }}>Filed against</h2>
          <dl className="detail-list">
            <dt>Contract</dt><dd>{String(proposal.vault_slug)}</dd>
            <dt>Prior digest</dt><dd><code>{String(proposal.prior_digest)}</code></dd>
            <dt>Draft digest</dt><dd><code>{String(proposal.draft_digest_at_review || "not yet weighed")}</code></dd>
          </dl>
        </article>
        <article className="rg-card">
          <h2 style={{ fontSize: 18 }}>Objection record</h2>
          <a href={String(proposal.draft_ref)} target="_blank" rel="noreferrer">View proposed code <ExternalLink size={13} /></a>
          <dl className="detail-list">
            <dt>Window closes</dt><dd>{String(proposal.objection_deadline || "not open yet")}</dd>
            <dt>Objection used</dt><dd>{String(proposal.objection_spent)}</dd>
            <dt>Evidence</dt><dd>{String(proposal.objection_ref || "none")}</dd>
            <dt>Reasoning</dt><dd>{String(proposal.objection_brief || "none")}</dd>
          </dl>
        </article>
      </div>

      <ProposalActions proposal={proposal} onFinalized={refresh} />
    </div>
  );
}
