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
  return (
    <AppHeader>
      <section className="qv-topstrip">
        <div className="qv-topstrip-intro">
          <p className="eyebrow">Overview</p>
          <h1>Nothing installs without a second opinion.</h1>
          <p className="lede">Every contract enrolled here has handed its own update key to a panel of independent validators. A change only ships after they read the code, weigh it against your rules, and let a window pass for anyone to object.</p>
          <NetworkStatus />
        </div>
        <div className="qv-statrail">
          {Object.entries({
            "Enrolled contracts": ledger.summary.vault_total ?? "-",
            "Change requests": ledger.summary.amendment_total ?? "-",
            "Cleared for install": ledger.summary.cleared_total ?? "-",
            "Actually installed": ledger.summary.installed_total ?? "-",
          }).map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </div>
      </section>

      <div className="qv-body">
        {error ? (
          <p className="rg-alert">{error}</p>
        ) : loading ? (
          <p><LoaderCircle className="spin" /> Reading the chain...</p>
        ) : (
          <>
            <section className="qv-block">
              <div className="section-row">
                <h2>Contracts under review</h2>
                <Link className="text-link" href="/vaults">See all</Link>
              </div>
              {ledger.vaults.length ? (
                <div className="qv-rows">
                  {ledger.vaults.slice(0, 4).map((target) => <TargetCard key={String(target.slug)} target={target} />)}
                </div>
              ) : (
                <p className="rg-empty">No contract has handed over its update key yet.</p>
              )}
            </section>

            <section className="qv-block">
              <div className="section-row">
                <h2>Open change requests</h2>
                <Link className="text-link" href="/amendments">See all</Link>
              </div>
              {ledger.amendments.length ? (
                <div className="qv-rows">
                  {ledger.amendments.slice(0, 4).map((proposal) => <ProposalCard key={String(proposal.slug)} proposal={proposal} targets={ledger.vaults} />)}
                </div>
              ) : (
                <p className="rg-empty">Nobody has proposed a change yet.</p>
              )}
            </section>
          </>
        )}

        <section className="qv-block">
          <h2>The review path</h2>
          <ol className="qv-flow">
            <li><span>1</span><div>A contract hands its update key to Quorum Vault and states its own rules for what a safe change looks like.</div></li>
            <li><span>2</span><div>Someone with signing rights points at a pinned copy of the proposed code.</div></li>
            <li><span>3</span><div>Independent validators read both versions and score the diff against those rules.</div></li>
            <li><span>4</span><div>If it passes, a fixed window opens where anyone can flag a concern before it locks in.</div></li>
            <li><span>5</span><div>Quorum Vault re-checks the code one last time, then hands it to the contract to install.</div></li>
            <li><span>6</span><div>The record only closes once the contract itself confirms it is running the new code.</div></li>
          </ol>
        </section>
      </div>
    </AppHeader>
  );
}
