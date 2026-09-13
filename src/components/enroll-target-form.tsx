"use client";

import { useState } from "react";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";
import { useTargetPreview, TargetPreviewCard } from "@/components/target-preview";
import { sourceUrlError } from "@/lib/validation/url";

const DEFAULT_POLICY = "A change may only clear if it keeps this contract's storage layout unchanged, leaves the update key with this contract's chosen custodian, moves no assets, and honestly reports whichever release is actually running.";

const EXAMPLE = {
  id: "counter-demo",
  name: "Counter (demo)",
  target: "0x34dfd83798AA2040356f0AeDEB584DAeFb39293e",
  source: "https://raw.githubusercontent.com/Hilda26/QuorumVault/b7dfb833b4cc1b8d98719ad6726d9436e6306697/contracts/VaultCounter.py",
};

export function EnrollTargetForm({ onFinalized }: { onFinalized: () => Promise<void> }) {
  const [form, setForm] = useState({ id: "", name: "", target: "", source: "", charter: DEFAULT_POLICY });
  const { error, transactions, send } = useWalletAction(onFinalized);
  const { wrongNetwork } = useNetworkGuard();
  const { preview, loading, check } = useTargetPreview();
  const urlError = sourceUrlError(form.source);

  function fillExample() {
    setForm({ id: EXAMPLE.id, name: EXAMPLE.name, target: EXAMPLE.target, source: EXAMPLE.source, charter: DEFAULT_POLICY });
    void check(EXAMPLE.target);
  }

  return (
    <section className="form-shell">
      <div>
        <p className="eyebrow">Hand over a key</p>
        <h2>Enroll a contract</h2>
        <p>This transaction goes to the contract you&apos;re enrolling, not to Quorum Vault directly -- only that contract&apos;s own keeper can trigger it, which is why the address below matters more than your wallet.</p>
      </div>
      <NetworkGuard />
      {error && <p className="form-error">{error}</p>}
      <form
        className="rg-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (urlError) return;
          void send("Enroll contract", "request_join", [form.id, form.name, form.charter, form.source], form.target as `0x${string}`);
        }}
      >
        <label>A short name for tracking<input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="counter-main" /></label>
        <label>Display label<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Counter" /></label>
        <label className="wide">
          The contract&apos;s address
          <input required value={form.target} onChange={(e) => { setForm({ ...form, target: e.target.value }); void check(e.target.value); }} placeholder="0x..." />
          <TargetPreviewCard preview={preview} loading={loading} />
        </label>
        <label className="wide">
          Where its current code lives (commit-pinned)
          <input required type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://raw.githubusercontent.com/.../commit/..." />
          {urlError && <span className="form-error" style={{ display: "block" }}>{urlError}</span>}
        </label>
        <label className="wide">Its rules for what counts as a safe change<textarea required value={form.charter} onChange={(e) => setForm({ ...form, charter: e.target.value })} /></label>
        <div className="button-row">
          <button disabled={wrongNetwork || Boolean(urlError)}>Hand over the key</button>
          <button type="button" className="quiet" onClick={fillExample}>Fill with a working example</button>
        </div>
      </form>
      <TxLifecycleList transactions={transactions} />
    </section>
  );
}
