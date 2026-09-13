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
  const [target, setTarget] = useState<Vault>(); const [error, setError] = useState<string>(); const [account, setAccount] = useState("");
  const { address, profile } = useWallet();
  const refresh = useCallback(async () => { try { setError(undefined); setTarget(await readContract<Vault>("get_vault", [id])); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load vault."); } }, [id]);
  useEffect(() => { void refresh(); }, [refresh]);
  const { error: actionError, transactions, send } = useWalletAction(refresh);
  const { wrongNetwork } = useNetworkGuard();
  if (error) return <section className="rg-section"><p className="rg-alert">{error}</p><Link href="/vaults">Return to vaults</Link></section>;
  if (!target) return <section className="rg-section"><p><LoaderCircle className="spin"/> Reading live vault...</p></section>;
  const isKeeper = address?.toLowerCase() === String(target.keeper).toLowerCase(); const isSigner = Boolean(profile?.signer_on?.includes(id));
  return <><section className="page-intro"><p className="eyebrow">VAULT</p><Link className="back-link" href="/vaults">Back to vaults</Link><h1>{String(target.label)}</h1><p className="lede">{isKeeper ? "You are the keeper for this vault." : isSigner ? "You are an authorized signer for this vault." : "Live Quorum Vault record."}</p><span className={`badge ${target.open ? "green" : "red"}`}>{target.open ? "OPEN" : "SUSPENDED"}</span></section><section className="rg-section"><div className="detail-grid"><article className="rg-card"><h2>Vault record</h2><dl className="detail-list"><dt>Vault slug</dt><dd>{String(target.slug)}</dd><dt>Release</dt><dd>{String(target.release)}</dd><dt>Amendment count</dt><dd>{String(target.amendment_count)}</dd><dt>Open amendment</dt><dd>{String(target.open_amendment || "None")}</dd><dt>Keeper</dt><dd><code>{String(target.keeper)}</code></dd></dl></article><article className="rg-card"><h2>Custody and source</h2><dl className="detail-list"><dt>Member contract</dt><dd><a href={addressUrl(String(target.member_address))} target="_blank" rel="noreferrer"><code>{String(target.member_address)}</code> <ExternalLink size={12}/></a></dd><dt>Quorum Vault</dt><dd><a href={addressUrl(process.env.NEXT_PUBLIC_QUORUMVAULT_CONTRACT ?? "")} target="_blank" rel="noreferrer">Open Quorum Vault <ExternalLink size={12}/></a></dd><dt>Source digest</dt><dd><code>{String(target.source_digest)}</code></dd></dl><a href={String(target.source_ref)} target="_blank" rel="noreferrer">Pinned source <ExternalLink size={13}/></a></article></div><section className="proposal-actions"><p className="eyebrow">KEEPER CONTROLS</p><h2>Vault management</h2><NetworkGuard/>{actionError && <p className="form-error">{actionError}</p>}<form className="action-card" onSubmit={(event) => { event.preventDefault(); void send("Authorize signer", "set_signer", [id, account, true]); }}><h3>Manage signer</h3><p>Contract authorization remains authoritative. Only the keeper can change signers.</p><label>Signer address<input required value={account} onChange={(event) => setAccount(event.target.value)} placeholder="0x..."/></label><div className="button-row"><button disabled={wrongNetwork}>Authorize signer</button><button type="button" className="quiet" disabled={wrongNetwork} onClick={() => void send("Remove signer", "set_signer", [id, account, false])}>Remove signer</button></div></form><div className="action-card danger-action"><h3>Suspend vault</h3><p>Suspension stops new amendments for this vault. The contract rejects suspension while an amendment is unresolved.</p><button onClick={() => void send("Suspend vault", "suspend_vault", [id])} disabled={!target.open || wrongNetwork}>Suspend vault</button></div><TxLifecycleList transactions={transactions}/></section></section></>;
}
