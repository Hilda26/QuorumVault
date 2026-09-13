"use client";

import { useState } from "react";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";
import { useTargetPreview, TargetPreviewCard } from "@/components/target-preview";
import { sourceUrlError } from "@/lib/validation/url";

const policy = "Only clear amendments that preserve the declared storage layout, keep this vault's custodian as the sole release authority, retain public reads, move no assets, and truthfully expose the drafted release.";

export function EnrollTargetForm({ onFinalized }: { onFinalized: () => Promise<void> }) {
  const [form, setForm] = useState({ id: "", name: "", target: "", source: "", charter: policy });
  const { error, transactions, send } = useWalletAction(onFinalized);
  const { wrongNetwork } = useNetworkGuard();
  const { preview, loading, check } = useTargetPreview();
  const urlError = sourceUrlError(form.source);

  return (
    <section className="form-shell">
      <div>
        <p className="eyebrow">SECURE ENROLLMENT</p>
        <h2>Join a vault</h2>
        <p>Enrollment is sent to the member contract first. Only the member&apos;s keeper can initiate it. Quorum Vault rejects direct wallet registration.</p>
      </div>
      <NetworkGuard />
      {error && <p className="form-error">{error}</p>}
      <form
        className="rg-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (urlError) return;
          void send("Vault enrollment", "request_join", [form.id, form.name, form.charter, form.source], form.target as `0x${string}`);
        }}
      >
        <label>Vault slug<input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="counter-main" /></label>
        <label>Vault label<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Quorum Vault Counter" /></label>
        <label className="wide">
          Member contract address
          <input
            required
            value={form.target}
            onChange={(e) => { setForm({ ...form, target: e.target.value }); void check(e.target.value); }}
            placeholder="0x..."
          />
          <TargetPreviewCard preview={preview} loading={loading} />
        </label>
        <label className="wide">
          Commit-pinned founding source URL
          <input required type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://raw.githubusercontent.com/.../commit/..." />
          {urlError && <span className="form-error" style={{ display: "block" }}>{urlError}</span>}
        </label>
        <label className="wide">Vault policy<textarea required value={form.charter} onChange={(e) => setForm({ ...form, charter: e.target.value })} /></label>
        <button disabled={wrongNetwork || Boolean(urlError)}>Request secure enrollment</button>
      </form>
      <TxLifecycleList transactions={transactions} />
    </section>
  );
}
