import Link from "next/link";
import type { Amendment, Vault } from "@/lib/quorumvault";
import { statusTone } from "@/lib/contract/status";

export function ProposalCard({ proposal, targets }: { proposal: Amendment; targets?: Vault[] }) {
  const target = targets?.find((item) => String(item.slug) === String(proposal.vault_slug));
  const stage = String(proposal.stage);
  return <article className="rg-card"><div className="card-head"><strong>{String(proposal.slug)}</strong><span className={`badge ${statusTone(stage)}`}>{stage}</span></div><dl className="detail-list compact"><dt>Vault</dt><dd>{target ? String(target.label) : String(proposal.vault_slug)}</dd><dt>Release</dt><dd>{String(proposal.prior_release)} to {String(proposal.next_release)}</dd><dt>Outcome</dt><dd>{String(proposal.outcome)} / {String(proposal.certainty)}</dd><dt>Draft digest</dt><dd><code>{String(proposal.draft_digest_at_review || "Pending review")}</code></dd></dl><p className="clamp-text">{String(proposal.notes || "Awaiting consensus review.")}</p><Link className="text-link" href={`/amendments/${encodeURIComponent(String(proposal.slug))}`}>Open lifecycle</Link></article>;
}
