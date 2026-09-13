import { ExternalLink } from "lucide-react";
import { CONTRACT_ADDRESS, addressUrl } from "@/lib/quorumvault";

export function NetworkStatus() {
  return <p className="rg-address">Network: StudioNet · {CONTRACT_ADDRESS ? <a href={addressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">{CONTRACT_ADDRESS}<ExternalLink size={14}/></a> : "Quorum Vault contract not configured"}</p>;
}
