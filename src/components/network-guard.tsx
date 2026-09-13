"use client";

import { useEffect, useState } from "react";
import { STUDIONET_CHAIN_ID, STUDIONET_CHAIN_ID_HEX } from "@/lib/network";

export function useNetworkGuard() {
  const [chainId, setChainId] = useState<number>();
  const [checked, setChecked] = useState(false);

  async function refresh() {
    if (typeof window === "undefined" || !window.ethereum) {
      setChecked(true);
      return;
    }
    try {
      const hex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      setChainId(Number.parseInt(hex, 16));
    } catch {
      setChainId(undefined);
    } finally {
      setChecked(true);
    }
  }

  useEffect(() => {
    void refresh();
    if (typeof window === "undefined" || !window.ethereum?.on) return;
    const handler = () => void refresh();
    window.ethereum.on("chainChanged", handler);
    return () => window.ethereum?.removeListener?.("chainChanged", handler);
  }, []);

  async function switchNetwork() {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET_CHAIN_ID_HEX }] });
    } catch {
      /* User declined or wallet does not support programmatic switching -- they can switch manually. */
    }
  }

  const wrongNetwork = checked && chainId !== undefined && chainId !== STUDIONET_CHAIN_ID;
  return { wrongNetwork, chainId, switchNetwork };
}

export function NetworkGuard() {
  const { wrongNetwork, chainId, switchNetwork } = useNetworkGuard();
  if (!wrongNetwork) return null;
  return (
    <div className="rg-alert">
      <span>
        Wrong network detected (chain {chainId}). RootGuard runs on GenLayer StudioNet (chain {STUDIONET_CHAIN_ID}).
        Writes are blocked until you switch.
      </span>
      <button type="button" onClick={() => void switchNetwork()}>
        Switch network
      </button>
    </div>
  );
}
