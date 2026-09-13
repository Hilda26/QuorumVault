/**
 * Client-side mirror of QuorumVault.py's _check_source_ref. The contract is
 * the real security boundary -- this exists purely so a bad URL is rejected
 * before a wallet signature is requested, not just after a reverted tx.
 */
const ALLOWED_HOSTS = ["raw.githubusercontent.com", "gitlab.com", "codeberg.org"];
const HEX_40 = /^[0-9a-f]{40}$/i;

export function isCommitPinnedSourceUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) return false;
  const segments = parsed.pathname.split("/").filter(Boolean);
  return segments.some((segment) => HEX_40.test(segment));
}

export function sourceUrlError(url: string): string | undefined {
  if (!url.trim()) return undefined;
  if (!isCommitPinnedSourceUrl(url)) {
    return `Must be an HTTPS URL on ${ALLOWED_HOSTS.join(", ")} that includes a 40-character commit hash segment. Quorum Vault rejects anything else.`;
  }
  return undefined;
}
