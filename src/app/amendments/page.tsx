"use client";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ProposalCard } from "@/components/proposal-card";
import { SubmitProposalForm } from "@/components/submit-proposal-form";
import { useLiveLedger } from "@/components/live-ledger";

export default function ProposalsPage() {
  const { ledger, loading, error, refresh } = useLiveLedger();
  return (
    <AppHeader>
      <div className="qv-body" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Change requests</p>
        <h1>Everything anyone has tried to change</h1>
        <p className="lede">A row here exists the moment a signer points at candidate code, whether or not it ever clears review. Click into one to see exactly what the validators saw and said.</p>
        <section className="qv-block" style={{ marginTop: 32 }}>
          {error ? (
            <p className="rg-alert">{error}</p>
          ) : loading ? (
            <p><LoaderCircle className="spin" /> Reading the chain...</p>
          ) : ledger.amendments.length ? (
            <div className="qv-rows">{ledger.amendments.map((proposal) => <ProposalCard key={String(proposal.slug)} proposal={proposal} targets={ledger.vaults} />)}</div>
          ) : (
            <p className="rg-empty">Nobody has proposed anything yet.</p>
          )}
        </section>
        <SubmitProposalForm targets={ledger.vaults} onFinalized={refresh} />
      </div>
    </AppHeader>
  );
}
