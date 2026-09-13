import Link from "next/link";
import type { Amendment, Vault } from "@/lib/quorumvault";
import { statusTone, stageLabel } from "@/lib/contract/status";

export function ProposalCard({ proposal, targets }: { proposal: Amendment; targets?: Vault[] }) {
  const target = targets?.find((item) => String(item.slug) === String(proposal.vault_slug));
  const stage = String(proposal.stage);
  return (
    <Link className="qv-row" href={`/amendments/${encodeURIComponent(String(proposal.slug))}`}>
      <div className="qv-row-title">
        <strong>{String(proposal.slug)}</strong>
        <span>{target ? String(target.label) : String(proposal.vault_slug)}</span>
      </div>
      <div className="qv-row-meta">{String(proposal.prior_release)} &rarr; {String(proposal.next_release)}</div>
      <div className="qv-row-note">{String(proposal.notes || "Not weighed yet.")}</div>
      <span className={`badge ${statusTone(stage)}`}>{stageLabel(stage)}</span>
    </Link>
  );
}
