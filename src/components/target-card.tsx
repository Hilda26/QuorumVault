import { ExternalLink } from "lucide-react";
import type { Vault } from "@/lib/quorumvault";
import Link from "next/link";

export function TargetCard({ target }: { target: Vault }) {
  return <article className="rg-card"><div className="card-head"><strong>{String(target.label)}</strong><span className={`badge ${target.open ? "green" : "red"}`}>{target.open ? "OPEN" : "SUSPENDED"}</span></div><dl className="detail-list"><dt>Vault slug</dt><dd>{String(target.slug)}</dd><dt>Member</dt><dd><code>{String(target.member_address)}</code></dd><dt>Release</dt><dd>{String(target.release)}</dd><dt>Keeper</dt><dd><code>{String(target.keeper)}</code></dd><dt>Source digest</dt><dd><code>{String(target.source_digest)}</code></dd></dl><div className="card-links"><Link className="text-link" href={`/vaults/${encodeURIComponent(String(target.slug))}`}>Open vault</Link><a href={String(target.source_ref)} target="_blank" rel="noreferrer">Pinned source <ExternalLink size={13}/></a></div></article>;
}
