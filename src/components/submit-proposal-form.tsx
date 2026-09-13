"use client";

import { useState } from "react";
import type { Vault } from "@/lib/quorumvault";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";
import { sourceUrlError } from "@/lib/validation/url";

const EXAMPLE_SOURCE = "https://raw.githubusercontent.com/Hilda26/QuorumVault/b7dfb833b4cc1b8d98719ad6726d9436e6306697/contracts/VaultCounterR2.py";
const EXAMPLE_BRIEF = "Adds an add(amount) write method and reports release r2. Storage layout, custody, and existing reads are all unchanged; no assets move.";

export function SubmitProposalForm({ targets, onFinalized }: { targets: Vault[]; onFinalized: () => Promise<void> }) {
  const [form, setForm] = useState({ id: "", target: "", source: "", version: "", summary: "" });
  const { error, transactions, send } = useWalletAction(onFinalized);
  const { wrongNetwork } = useNetworkGuard();
  const urlError = sourceUrlError(form.source);
  const briefTooShort = form.summary.trim().length > 0 && form.summary.trim().length < 80;

  function fillExample() {
    setForm((prev) => ({
      ...prev,
      id: prev.id || "counter-r2",
      target: prev.target || String(targets[0]?.slug ?? ""),
      source: EXAMPLE_SOURCE,
      version: "r2",
      summary: EXAMPLE_BRIEF,
    }));
  }

  return (
    <section className="form-shell">
      <div>
        <p className="eyebrow">Propose a change</p>
        <h2>File a change request</h2>
        <p>Only someone the contract&apos;s keeper has authorized can file one. The moment you submit, the proposed code gets fetched and locked in -- editing it afterward won&apos;t affect what the validators see.</p>
      </div>
      <NetworkGuard />
      {error && <p className="form-error">{error}</p>}
      <form
        className="rg-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (urlError || briefTooShort) return;
          void send("File change request", "draft_amendment", [form.id, form.target, form.source, form.version, form.summary]);
        }}
      >
        <label>A short name for tracking<input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="counter-r2" /></label>
        <label>
          Which contract
          <select required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
            <option value="">choose one</option>
            {targets.map((target) => (
              <option key={String(target.slug)} value={String(target.slug)}>{String(target.label)}</option>
            ))}
          </select>
        </label>
        <label className="wide">
          Where the proposed code lives (commit-pinned)
          <input required type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://raw.githubusercontent.com/.../commit/..." />
          {urlError && <span className="form-error" style={{ display: "block" }}>{urlError}</span>}
        </label>
        <label>What release tag it becomes<input required value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="r2" /></label>
        <label className="wide">
          Why this change is safe ({form.summary.trim().length}/80 min)
          <textarea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What changed and why it doesn&apos;t touch storage, custody, or funds" />
          {briefTooShort && <span className="form-error" style={{ display: "block", marginTop: 6 }}>Needs at least 80 characters -- {80 - form.summary.trim().length} to go.</span>}
        </label>
        <div className="button-row">
          <button disabled={!targets.length || wrongNetwork || Boolean(urlError) || briefTooShort}>File the request</button>
          <button type="button" className="quiet" disabled={!targets.length} onClick={fillExample}>Fill with a working example</button>
        </div>
      </form>
      <TxLifecycleList transactions={transactions} />
    </section>
  );
}
