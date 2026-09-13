"use client";

import { useState } from "react";
import type { Vault } from "@/lib/quorumvault";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";
import { sourceUrlError } from "@/lib/validation/url";

export function SubmitProposalForm({ targets, onFinalized }: { targets: Vault[]; onFinalized: () => Promise<void> }) {
  const [form, setForm] = useState({ id: "", target: "", source: "", version: "", summary: "" });
  const { error, transactions, send } = useWalletAction(onFinalized);
  const { wrongNetwork } = useNetworkGuard();
  const urlError = sourceUrlError(form.source);

  return (
    <section className="form-shell">
      <div>
        <p className="eyebrow">AMENDMENT DRAFT</p>
        <h2>Draft an amendment</h2>
        <p>Quorum Vault accepts only commit-pinned public source. The contract snapshots the vault&apos;s baseline before consensus review.</p>
      </div>
      <NetworkGuard />
      {error && <p className="form-error">{error}</p>}
      <form
        className="rg-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (urlError) return;
          void send("Draft amendment", "draft_amendment", [form.id, form.target, form.source, form.version, form.summary]);
        }}
      >
        <label>Amendment slug<input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="counter-r2" /></label>
        <label>
          Vault
          <select required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
            <option value="">Select vault</option>
            {targets.map((target) => (
              <option key={String(target.slug)} value={String(target.slug)}>{String(target.label)} ({String(target.slug)})</option>
            ))}
          </select>
        </label>
        <label className="wide">
          Commit-pinned draft source URL
          <input required type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://raw.githubusercontent.com/.../commit/..." />
          {urlError && <span className="form-error" style={{ display: "block" }}>{urlError}</span>}
        </label>
        <label>Next release tag<input required value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="r2" /></label>
        <label className="wide">Brief<textarea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Describe the storage-safe, custody-safe change in at least 80 characters." /></label>
        <button disabled={!targets.length || wrongNetwork || Boolean(urlError)}>Submit for GenLayer review</button>
      </form>
      <TxLifecycleList transactions={transactions} />
    </section>
  );
}
