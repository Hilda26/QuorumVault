"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
import { VaultMark } from "@/components/vault-mark";

export function AppHeader() {
  const { address, connect: connectWallet, disconnect, error, profile } = useWallet(); const path = usePathname();
  async function handleConnect() {
    try {
      await connectWallet();
    } catch { /* Shared provider exposes the connection error. */ }
  }
  const active = (href: string) => href === "/" ? path === "/" : path.startsWith(href);
  const roles = profile ? [...(profile.kept_vaults ?? []).map((id) => `KEEPER · ${id}`), ...(profile.signer_on ?? []).map((id) => `SIGNER · ${id}`), ...(profile.drafted_amendments ?? []).map((id) => `DRAFTED · ${id}`)] : [];
  return <><header className="rg-header"><Link className="rg-mark" href="/"><VaultMark/><span>QUORUM VAULT</span></Link><nav><Link className={active("/") ? "active-nav" : ""} href="/">Dashboard</Link><Link className={active("/vaults") ? "active-nav" : ""} href="/vaults">Vaults</Link><Link className={active("/amendments") ? "active-nav" : ""} href="/amendments">Amendments</Link></nav><div className="rg-wallet">{address ? <><code>{address.slice(0, 8)}...{address.slice(-6)}</code>{roles.length ? <span className="role-hint">{roles[0]}</span> : null}<button onClick={disconnect}>Disconnect</button></> : <button onClick={handleConnect}>Connect wallet</button>}</div></header>{error && <div className="rg-alert">{error}</div>}</>;
}
