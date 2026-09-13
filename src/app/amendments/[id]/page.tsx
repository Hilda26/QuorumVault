import { AppHeader } from "@/components/app-header";
import { ProposalDetail } from "@/components/proposal-detail";
export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppHeader><ProposalDetail id={decodeURIComponent(id)} /></AppHeader>;
}
