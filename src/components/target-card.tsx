import type { Vault } from "@/lib/quorumvault";
import Link from "next/link";

export function TargetCard({ target }: { target: Vault }) {
  return (
    <Link className="qv-row" href={`/vaults/${encodeURIComponent(String(target.slug))}`}>
      <div className="qv-row-title">
        <strong>{String(target.label)}</strong>
        <span>{String(target.slug)}</span>
      </div>
      <div className="qv-row-meta">running <code>{String(target.release)}</code></div>
      <div className="qv-row-meta">key held by <code>{String(target.keeper).slice(0, 6)}...{String(target.keeper).slice(-4)}</code></div>
      <span className={`badge ${target.open ? "green" : "red"}`}>{target.open ? "accepting changes" : "locked"}</span>
    </Link>
  );
}
