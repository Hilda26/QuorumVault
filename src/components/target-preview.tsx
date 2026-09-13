"use client";

import { useState } from "react";
import { readContractAt } from "@/lib/quorumvault";

type Preview = { release?: string; keeper?: string; error?: string };

export function useTargetPreview() {
  const [preview, setPreview] = useState<Preview>();
  const [loading, setLoading] = useState(false);

  async function check(address: string) {
    setPreview(undefined);
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return;
    setLoading(true);
    try {
      const [release, keeper] = await Promise.all([
        readContractAt<string>(address as `0x${string}`, "get_release"),
        readContractAt<string>(address as `0x${string}`, "get_keeper"),
      ]);
      setPreview({ release, keeper });
    } catch (cause) {
      setPreview({ error: cause instanceof Error ? cause.message : "Unable to read this address as a contract." });
    } finally {
      setLoading(false);
    }
  }

  return { preview, loading, check };
}

export function TargetPreviewCard({ preview, loading }: { preview?: Preview; loading: boolean }) {
  if (loading) return <p className="muted" style={{ fontSize: 12 }}>Reading contract at this address...</p>;
  if (!preview) return null;
  if (preview.error) return <p className="form-error">Could not verify this address before signing: {preview.error}</p>;
  return (
    <div className="gate pass" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <span>Verified before signing -- release {preview.release}, keeper {preview.keeper?.slice(0, 8)}...{preview.keeper?.slice(-6)}</span>
    </div>
  );
}
