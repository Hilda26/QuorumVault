"use client";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EnrollTargetForm } from "@/components/enroll-target-form";
import { TargetCard } from "@/components/target-card";
import { useLiveLedger } from "@/components/live-ledger";

export default function TargetsPage() {
  const { ledger, loading, error, refresh } = useLiveLedger();
  return (
    <AppHeader>
      <div className="qv-body" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Enrolled contracts</p>
        <h1>Who has handed over their key</h1>
        <p className="lede">Each row is a contract that named Quorum Vault as its sole update authority. Its own on-chain state, not this page, is where that fact is actually enforced.</p>
        <section className="qv-block" style={{ marginTop: 32 }}>
          {error ? (
            <p className="rg-alert">{error}</p>
          ) : loading ? (
            <p><LoaderCircle className="spin" /> Reading the chain...</p>
          ) : ledger.vaults.length ? (
            <div className="qv-rows">{ledger.vaults.map((target) => <TargetCard key={String(target.slug)} target={target} />)}</div>
          ) : (
            <p className="rg-empty">Nothing enrolled yet.</p>
          )}
        </section>
        <EnrollTargetForm onFinalized={refresh} />
      </div>
    </AppHeader>
  );
}
