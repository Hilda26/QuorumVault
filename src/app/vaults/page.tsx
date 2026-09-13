"use client";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EnrollTargetForm } from "@/components/enroll-target-form";
import { TargetCard } from "@/components/target-card";
import { useLiveLedger } from "@/components/live-ledger";
export default function TargetsPage() { const { ledger, loading, error, refresh } = useLiveLedger(); return <main className="rg-shell"><AppHeader/><section className="page-intro"><p className="eyebrow">CUSTODY REGISTRY</p><h1>Vaults</h1><p className="lede">Live vaults enrolled through their keeper-controlled member contracts.</p></section><section className="rg-section">{error ? <p className="rg-alert">{error}</p> : loading ? <p><LoaderCircle className="spin"/> Reading live vaults...</p> : ledger.vaults.length ? <div className="rg-cards">{ledger.vaults.map((target) => <TargetCard key={String(target.slug)} target={target}/>)}</div> : <p className="rg-empty">No vaults are enrolled.</p>}<EnrollTargetForm onFinalized={refresh}/></section></main>; }
