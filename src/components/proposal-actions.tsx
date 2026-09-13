"use client";

import { useEffect, useState } from "react";
import type { Amendment } from "@/lib/quorumvault";
import { useWallet } from "@/components/wallet-provider";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";

const EXAMPLE_EVIDENCE_URL = "https://raw.githubusercontent.com/Hilda26/QuorumVault/main/README.md";
const EXAMPLE_EVIDENCE_BRIEF = "This change appears to drop a public read method that other integrations depend on -- flagging for a second look before it installs.";

export function ProposalActions({ proposal, onFinalized }: { proposal: Amendment; onFinalized: () => Promise<void> }) {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const { profile } = useWallet();
  const { error, transactions, send } = useWalletAction(onFinalized);
  const { wrongNetwork } = useNetworkGuard();
  const id = String(proposal.slug);
  const stage = String(proposal.stage);
  const vaultSlug = String(proposal.vault_slug);
  const isKeeper = profile?.kept_vaults?.includes(vaultSlug) ?? false;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const deadline = proposal.objection_deadline ? Date.parse(String(proposal.objection_deadline)) : 0;
  const objectionOpen = deadline ? now < deadline : true;
  const remaining = Math.max(0, deadline - now);
  const countdown = `${String(Math.floor(remaining / 3_600_000)).padStart(2, "0")}:${String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0")}:${String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0")}`;
  const retryAt = proposal.install_requested_at ? Date.parse(String(proposal.install_requested_at)) + Number(proposal.install_retry_cooldown ?? 120) * 1000 : 0;
  const retryReady = retryAt > 0 && now >= retryAt;
  const briefTooShort = summary.trim().length > 0 && summary.trim().length < 80;

  const simpleAction = (label: string, fn: string, note: string) => (
    <div className="action-card">
      <h3>{label}</h3>
      <p>{note}</p>
      <button disabled={wrongNetwork} onClick={() => void send(label, fn, [id])}>{label}</button>
    </div>
  );

  const withdrawAction = isKeeper && ["PENDING_REVIEW", "OBJECTION_WINDOW", "OBJECTED"].includes(stage) ? (
    <div className="action-card danger-action">
      <h3>Withdraw this request</h3>
      <p>Stops this change from ever installing and frees the contract up for a different one. The attempt stays on record either way.</p>
      <button disabled={wrongNetwork} onClick={() => void send("Withdraw request", "withdraw_amendment", [id])}>Withdraw request</button>
    </div>
  ) : null;

  return (
    <section className="proposal-actions">
      <p className="eyebrow">Available next steps</p>
      <h2>Take action on this request</h2>
      <NetworkGuard />
      {error && <p className="form-error">{error}</p>}

      {stage === "PENDING_REVIEW" && (
        <>
          {simpleAction("Send to validators", "weigh_amendment", "Kicks off an independent read of the current and proposed code. Takes a few minutes -- this is a real consensus round, not a lookup.")}
          {withdrawAction}
        </>
      )}

      {stage === "OBJECTION_WINDOW" && (
        <>
          <div className="countdown"><span>Time left to object</span><strong>{objectionOpen ? countdown : "closed"}</strong></div>
          <form
            className="action-card"
            onSubmit={(event) => {
              event.preventDefault();
              if (briefTooShort) return;
              void send("Flag a concern", "raise_objection", [id, url, summary]);
            }}
          >
            <h3>Flag a concern</h3>
            <p>{proposal.objection_spent ? "This request already used its one objection." : "One shot only, and only before the timer runs out. Whatever page you link gets captured immediately so it can&apos;t be edited after the fact."}</p>
            <label>
              Link to your evidence
              <input required disabled={Boolean(proposal.objection_spent) || !objectionOpen} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
            </label>
            <label>
              Explain the concern ({summary.trim().length}/80 min)
              <textarea required disabled={Boolean(proposal.objection_spent) || !objectionOpen} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What specifically looks wrong, and why it matters" />
              {briefTooShort && <span className="form-error" style={{ display: "block", marginTop: 6 }}>Needs at least 80 characters -- {80 - summary.trim().length} to go.</span>}
            </label>
            <div className="button-row">
              <button disabled={Boolean(proposal.objection_spent) || !objectionOpen || briefTooShort}>Flag a concern</button>
              <button type="button" className="quiet" disabled={Boolean(proposal.objection_spent) || !objectionOpen} onClick={() => { setUrl(EXAMPLE_EVIDENCE_URL); setSummary(EXAMPLE_EVIDENCE_BRIEF); }}>Fill example values</button>
            </div>
          </form>
          {objectionOpen ? (
            <div className="action-card disabled-action">
              <h3>Install the change</h3>
              <p>Unlocks once the timer above hits zero.</p>
              <button disabled>Install the change</button>
            </div>
          ) : (
            simpleAction("Install the change", "request_install", "Re-checks the code hasn&apos;t moved since it was reviewed, then hands it to the contract.")
          )}
          {withdrawAction}
        </>
      )}

      {stage === "OBJECTED" && (
        <>
          {simpleAction("Send back to validators", "reweigh_objection", "Re-runs the review with the flagged concern attached, so it&apos;s weighed alongside the code itself.")}
          {withdrawAction}
        </>
      )}

      {stage === "INSTALL_PENDING" && (
        <>
          <div className="action-card">
            <h3>Confirm it landed</h3>
            <p>Reads the contract directly and only closes this request out once it&apos;s actually running the new code.</p>
            <button onClick={() => void send("Confirm it landed", "confirm_install", [id])}>Confirm it landed</button>
          </div>
          {retryReady ? (
            simpleAction("Try installing again", "retry_install", "The contract hasn&apos;t picked up the change yet. This resends it after re-checking nothing changed underneath.")
          ) : (
            <div className="action-card disabled-action">
              <h3>Try installing again</h3>
              <p>Give it a little longer before retrying -- there&apos;s a short cooldown between attempts.</p>
              <button disabled>Try installing again</button>
            </div>
          )}
        </>
      )}

      {stage === "INSTALLED" && (
        <div className="action-card complete-action">
          <h3>Live</h3>
          <p>Confirmed by reading the contract&apos;s own state, not just by watching a transaction succeed.</p>
        </div>
      )}

      {["DENIED", "INCONCLUSIVE", "UNGROUNDED", "WITHDRAWN"].includes(stage) && (
        <div className="action-card disabled-action">
          <h3>Nothing left to do here</h3>
          <p>This request ended at: {stage.toLowerCase().replace("_", " ")}.</p>
        </div>
      )}

      <TxLifecycleList transactions={transactions} />
    </section>
  );
}
