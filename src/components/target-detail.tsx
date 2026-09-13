"use client";
import Link from "next/link";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { addressUrl, readContract, type Vault } from "@/lib/quorumvault";
import { useWallet } from "@/components/wallet-provider";
import { useWalletAction } from "@/components/wallet-action";
import { TxLifecycleList } from "@/components/tx-lifecycle";
import { NetworkGuard, useNetworkGuard } from "@/components/network-guard";

export function TargetDetail({ id }: { id: string }) {
  const [target, setTarget] = useState<Vault>();
  const [error, setError] = useState<string>();
  const [account, setAccount] = useState("");
  const { address, profile } = useWallet();
  const refresh = useCallback(async () => {
    try { setError(undefined); setTarget(await readContract<Vault>("get_vault", [id])); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read this contract's record."); }
  }, [id]);
  useEffect(() => { void refresh(); }, [refresh]);
  const { error: actionError, transactions, send } = useWalletAction(refresh);
  const { wrongNetwork } = useNetworkGuard();

  if (error) return <div className="qv-body"><p className="rg-alert">{error}</p><Link className="back-link" href="/vaults">Back to enrolled contracts</Link></div>;
  if (!target) return <div className="qv-body"><p><LoaderCircle className="spin" /> Reading the chain...</p></div>;

  const isKeeper = address?.toLowerCase() === String(target.keeper).toLowerCase();
  const isSigner = Boolean(profile?.signer_on?.includes(id));

  return (
    <div className="qv-body" style={{ paddingTop: 40 }}>
      <Link className="back-link" href="/vaults">Back to enrolled contracts</Link>
      <p className="eyebrow" style={{ marginTop: 16 }}>Enrolled contract</p>
      <h1>{String(target.label)}</h1>
      <p className="lede">{isKeeper ? "You hold this contract's update key." : isSigner ? "You are cleared to draft changes for this contract." : "Read-only record of this contract's enrollment."} <span className={`badge ${target.open ? "green" : "red"}`} style={{ marginLeft: 8 }}>{target.open ? "accepting changes" : "locked"}</span></p>

      <div className="detail-grid" style={{ marginTop: 28 }}>
        <article className="rg-card">
          <h2 style={{ fontSize: 18 }}>Record</h2>
          <dl className="detail-list">
            <dt>Slug</dt><dd>{String(target.slug)}</dd>
            <dt>Running release</dt><dd>{String(target.release)}</dd>
            <dt>Change requests filed</dt><dd>{String(target.amendment_count)}</dd>
            <dt>Currently open</dt><dd>{String(target.open_amendment || "none")}</dd>
            <dt>Key holder</dt><dd><code>{String(target.keeper)}</code></dd>
          </dl>
        </article>
        <article className="rg-card">
          <h2 style={{ fontSize: 18 }}>Source of truth</h2>
          <dl className="detail-list">
            <dt>Contract</dt>
            <dd><a href={addressUrl(String(target.member_address))} target="_blank" rel="noreferrer"><code>{String(target.member_address)}</code> <ExternalLink size={12} /></a></dd>
            <dt>Custodian</dt>
            <dd><a href={addressUrl(process.env.NEXT_PUBLIC_QUORUMVAULT_CONTRACT ?? "")} target="_blank" rel="noreferrer">Quorum Vault <ExternalLink size={12} /></a></dd>
            <dt>Digest</dt><dd><code>{String(target.source_digest)}</code></dd>
          </dl>
          <a href={String(target.source_ref)} target="_blank" rel="noreferrer">View pinned code <ExternalLink size={13} /></a>
        </article>
      </div>

      <section className="proposal-actions" style={{ marginTop: 28 }}>
        <p className="eyebrow">Key-holder controls</p>
        <h2>Manage this contract</h2>
        <NetworkGuard />
        {actionError && <p className="form-error">{actionError}</p>}
        <form className="action-card" onSubmit={(event) => { event.preventDefault(); void send("Authorize signer", "set_signer", [id, account, true]); }}>
          <h3>Add or remove a signer</h3>
          <p>Only you, the key holder, can change who else may draft changes here.</p>
          <label>Signer address<input required value={account} onChange={(event) => setAccount(event.target.value)} placeholder="0x..." /></label>
          <div className="button-row">
            <button disabled={wrongNetwork}>Add signer</button>
            <button type="button" className="quiet" disabled={wrongNetwork} onClick={() => void send("Remove signer", "set_signer", [id, account, false])}>Remove signer</button>
          </div>
        </form>
        <div className="action-card danger-action">
          <h3>Lock this contract</h3>
          <p>Stops new change requests. Anything already in flight has to resolve first.</p>
          <button onClick={() => void send("Lock contract", "suspend_vault", [id])} disabled={!target.open || wrongNetwork}>Lock contract</button>
        </div>
        <TxLifecycleList transactions={transactions} />
      </section>
    </div>
  );
}
