"use client";

import { useEffect, useState } from "react";
import type { Amendment } from "@/lib/quorumvault";
import { useWallet } from "@/components/wallet-provider";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";

export function ProposalActions({ proposal, onFinalized }: { proposal: Amendment; onFinalized: () => Promise<void> }) {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [now, setNow] = useState(Date.now());
  const { profile } = useWallet();
  const { error, transactions, send } = useWalletAction(onFinalized);
  const { wrongNetwork } = useNetworkGuard();
  const id = String(proposal.slug);
  const stage = String(proposal.stage);
  const vaultSlug = String(proposal.vault_slug);
  const isKeeper = profile?.kept_vaults?.includes(vaultSlug) ?? false;
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  const deadline = proposal.objection_deadline ? Date.parse(String(proposal.objection_deadline)) : 0;
  const objectionOpen = deadline ? now < deadline : true;
  const remaining = Math.max(0, deadline - now);
  const countdown = `${String(Math.floor(remaining / 3_600_000)).padStart(2, "0")}:${String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0")}:${String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0")}`;
  const retryAt = proposal.install_requested_at ? Date.parse(String(proposal.install_requested_at)) + Number(proposal.install_retry_cooldown ?? 120) * 1000 : 0;
  const retryReady = retryAt > 0 && now >= retryAt;
  const button = (label: string, fn: string, note: string) => <div className="action-card"><h3>{label}</h3><p>{note}</p><button disabled={wrongNetwork} onClick={() => void send(label, fn, [id])}>{label}</button></div>;
  const withdrawal = isKeeper && ["PENDING_REVIEW", "OBJECTION_WINDOW", "OBJECTED"].includes(stage) ? <div className="action-card danger-action"><h3>Withdraw amendment</h3><p>Withdrawal prevents this amendment from installing and releases the vault for a new amendment. Historical evidence remains on-chain.</p><button disabled={wrongNetwork} onClick={() => void send("Withdraw amendment", "withdraw_amendment", [id])}>Withdraw amendment</button></div> : null;

  return <section className="proposal-actions"><p className="eyebrow">STATE-AWARE ACTIONS</p><h2>Amendment controls</h2><NetworkGuard/>{error && <p className="form-error">{error}</p>}{stage === "PENDING_REVIEW" && <>{button("Weigh amendment", "weigh_amendment", "Validators independently fetch and assess the vault's current and drafted source.")}{withdrawal}</>}{stage === "OBJECTION_WINDOW" && <><div className="countdown"><span>Objection window</span><strong>{objectionOpen ? `${countdown} remaining` : "Closed"}</strong></div><form className="action-card" onSubmit={(event) => { event.preventDefault(); void send("Raise objection", "raise_objection", [id, url, summary]); }}><h3>Raise objection</h3><p>{proposal.objection_spent ? "This amendment has already used its one objection." : "Available once, before the on-chain deadline. Quorum Vault snapshots verified evidence before it changes state."}</p><label>Evidence URL<input required disabled={Boolean(proposal.objection_spent) || !objectionOpen} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label><label>Evidence summary<textarea required disabled={Boolean(proposal.objection_spent) || !objectionOpen} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Specific evidence-backed concern" /></label><button disabled={Boolean(proposal.objection_spent) || !objectionOpen}>Raise objection</button></form>{objectionOpen ? <div className="action-card disabled-action"><h3>Request install</h3><p>Available after the objection window closes. Quorum Vault enforces the deadline.</p><button disabled>Request install</button></div> : button("Request install", "request_install", "Quorum Vault will re-fetch and digest-check the immutable draft before queueing.")}{withdrawal}</>}{stage === "OBJECTED" && <>{button("Reweigh objection", "reweigh_objection", "Validators reassess the draft against the verified evidence snapshot.")}{withdrawal}</>}{stage === "INSTALL_PENDING" && <><div className="action-card"><h3>Confirm install</h3><p>Available after the member contract installs the queued release.</p><button onClick={() => void send("Confirm install", "confirm_install", [id])}>Confirm install</button></div>{retryReady ? button("Retry install", "retry_install", "The prior finalized child has not produced the drafted release. Quorum Vault re-checks the exact draft digest before emitting the same install again.") : <div className="action-card disabled-action"><h3>Retry install</h3><p>Available after the bounded retry cooldown. Quorum Vault never cancels a pending install while an earlier child could still land.</p><button disabled>Retry install</button></div>}</>}{stage === "INSTALLED" && <div className="action-card complete-action"><h3>Install confirmed</h3><p>Quorum Vault read the member contract and only then recorded the amendment as installed.</p></div>}{["DENIED", "INCONCLUSIVE", "UNGROUNDED", "WITHDRAWN"].includes(stage) && <div className="action-card disabled-action"><h3>No executable action</h3><p>This amendment is terminal: {stage}.</p></div>}<TxLifecycleList transactions={transactions}/></section>;
}
