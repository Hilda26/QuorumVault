"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
import { VaultMark } from "@/components/vault-mark";

export function AppHeader({ children }: { children: React.ReactNode }) {
  const { address, connect: connectWallet, disconnect, error, profile } = useWallet();
  const path = usePathname();
  async function handleConnect() {
    try {
      await connectWallet();
    } catch { /* Shared provider exposes the connection error. */ }
  }
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  function firstRole(): string | undefined {
    if (!profile) return undefined;
    if (profile.kept_vaults?.[0]) return `Keeper of ${profile.kept_vaults[0]}`;
    if (profile.signer_on?.[0]) return `Signer on ${profile.signer_on[0]}`;
    if (profile.drafted_amendments?.[0]) return `Drafted ${profile.drafted_amendments[0]}`;
    return undefined;
  }
  const role = firstRole();

  return (
    <div className="qv-app">
      <aside className="qv-rail">
        <Link className="qv-brand" href="/">
          <VaultMark />
          <span>Quorum Vault</span>
        </Link>
        <nav className="qv-nav">
          <Link className={active("/") ? "active-nav" : ""} href="/"><span className="dot" />Overview</Link>
          <Link className={active("/vaults") ? "active-nav" : ""} href="/vaults"><span className="dot" />Enrolled contracts</Link>
          <Link className={active("/amendments") ? "active-nav" : ""} href="/amendments"><span className="dot" />Change requests</Link>
        </nav>
        <div className="qv-rail-foot">
          {address ? (
            <>
              <div className="qv-wallet-line"><code>{address.slice(0, 8)}...{address.slice(-6)}</code></div>
              {role && <span className="role-hint">{role}</span>}
              <button type="button" className="quiet" onClick={disconnect}>Disconnect</button>
            </>
          ) : (
            <button type="button" onClick={handleConnect}>Connect wallet</button>
          )}
        </div>
      </aside>
      <main className="qv-main">
        {error && <div className="rg-alert" style={{ margin: "0 0 0" }}>{error}</div>}
        {children}
      </main>
    </div>
  );
}
