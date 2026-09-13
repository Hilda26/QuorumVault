"use client";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ProposalCard } from "@/components/proposal-card";
import { SubmitProposalForm } from "@/components/submit-proposal-form";
import { useLiveLedger } from "@/components/live-ledger";
export default function ProposalsPage() { const { ledger, loading, error, refresh } = useLiveLedger(); return <main className="rg-shell"><AppHeader/><section className="page-intro"><p className="eyebrow">CONSENSUS REVIEW QUEUE</p><h1>Amendments</h1><p className="lede">Every amendment is source-bound, stage-driven, and linked to its own lifecycle page.</p></section><section className="rg-section">{error ? <p className="rg-alert">{error}</p> : loading ? <p><LoaderCircle className="spin"/> Reading live amendments...</p> : ledger.amendments.length ? <div className="rg-cards">{ledger.amendments.map((proposal) => <ProposalCard key={String(proposal.slug)} proposal={proposal} targets={ledger.vaults}/>)}</div> : <p className="rg-empty">No amendments are on-chain.</p>}<SubmitProposalForm targets={ledger.vaults} onFinalized={refresh}/></section></main>; }
