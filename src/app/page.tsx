"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NetworkStatus } from "@/components/network-status";
import { ProposalCard } from "@/components/proposal-card";
import { TargetCard } from "@/components/target-card";
import { useLiveLedger } from "@/components/live-ledger";

export default function Home() {
  const { ledger, loading, error } = useLiveLedger();
  return <main className="rg-shell"><AppHeader/><section className="rg-hero"><div><p className="eyebrow">GENLAYER GOVERNANCE AUTHORITY</p><h1>Code changes need proof, not just permission.</h1><p className="lede">A native custody authority with consensus-backed source review, a bounded objection window, exact-digest binding, and member confirmation.</p><NetworkStatus/></div><div className="rg-grid stats">{Object.entries({ Vaults: ledger.summary.vault_total ?? "-", Amendments: ledger.summary.amendment_total ?? "-", Cleared: ledger.summary.cleared_total ?? "-", Installed: ledger.summary.installed_total ?? "-" }).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>{error ? <p className="rg-alert">{error}</p> : loading ? <p className="rg-section"><LoaderCircle className="spin"/> Reading live Quorum Vault state...</p> : <><section className="rg-section"><div className="section-row"><div><p className="eyebrow">LIVE REGISTRY</p><h2>Recent vaults</h2></div><Link className="text-link" href="/vaults">View vaults</Link></div><div className="rg-cards">{ledger.vaults.slice(0, 3).map((target) => <TargetCard key={String(target.slug)} target={target}/>)}</div></section><section className="rg-section"><div className="section-row"><div><p className="eyebrow">LIVE REVIEW QUEUE</p><h2>Recent amendments</h2></div><Link className="text-link" href="/amendments">View amendments</Link></div><div className="rg-cards">{ledger.amendments.slice(0, 3).map((proposal) => <ProposalCard key={String(proposal.slug)} proposal={proposal} targets={ledger.vaults}/>)}</div></section></>}<section className="rg-section lifecycle-band"><p className="eyebrow">HOW QUORUM VAULT WORKS</p><ol className="how-steps"><li>Join a vault under its custodian</li><li>Draft commit-pinned amendment code</li><li>GenLayer validators weigh it against the policy</li><li>Cleared amendments enter a bounded objection window</li><li>Quorum Vault re-fetches and digest-checks the draft</li><li>Quorum Vault queues the finalized member install</li><li>Quorum Vault records INSTALLED only after member confirmation</li></ol></section></main>;
}
