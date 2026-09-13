"use client";

import { useState } from "react";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { writeContract, writeRootGuard, waitFinalized, CONTRACT_ADDRESS } from "@/lib/quorumvault";
import { STUDIONET_CHAIN_ID } from "@/lib/network";

export type TxState =
  | "IDLE"
  | "AWAITING_SIGNATURE"
  | "SUBMITTED"
  | "CONSENSUS_RUNNING"
  | "FINALIZED"
  | "EXECUTION_CONFIRMED"
  | "STATE_REREAD"
  | "DONE"
  | "USER_REJECTED"
  | "WRONG_NETWORK"
  | "RPC_ERROR"
  | "CONSENSUS_FAILURE"
  | "EXECUTION_ERROR"
  | "STATE_MISMATCH";

export type TxRecord = { hash: string; label: string; state: TxState; triggered: string[] };

const FAILURE_STATES = new Set<TxState>([
  "USER_REJECTED",
  "WRONG_NETWORK",
  "RPC_ERROR",
  "CONSENSUS_FAILURE",
  "EXECUTION_ERROR",
  "STATE_MISMATCH",
]);

export function isFailureState(state: TxState): boolean {
  return FAILURE_STATES.has(state);
}

async function currentChainId(): Promise<number | undefined> {
  if (typeof window === "undefined" || !window.ethereum) return undefined;
  try {
    const hex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    return Number.parseInt(hex, 16);
  } catch {
    return undefined;
  }
}

export function useTransaction(onSettled?: () => Promise<void> | void) {
  const [error, setError] = useState<string>();
  const [transactions, setTransactions] = useState<TxRecord[]>([]);

  function update(hash: string, state: TxState, triggered: string[] = []) {
    setTransactions((items) => items.map((item) => (item.hash === hash ? { ...item, state, triggered } : item)));
  }

  async function send(
    label: string,
    functionName: string,
    args: CalldataEncodable[],
    account: `0x${string}`,
    address?: `0x${string}`,
  ) {
    setError(undefined);
    const placeholder = `pending-${Date.now()}`;
    setTransactions((items) => [{ hash: placeholder, label, state: "AWAITING_SIGNATURE", triggered: [] }, ...items]);

    const chainId = await currentChainId();
    if (chainId !== undefined && chainId !== STUDIONET_CHAIN_ID) {
      update(placeholder, "WRONG_NETWORK");
      setError("Wrong network. Switch your wallet to GenLayer StudioNet and try again.");
      return;
    }

    const destination = address ?? CONTRACT_ADDRESS;
    if (!destination) {
      update(placeholder, "RPC_ERROR");
      setError("RootGuard contract not configured.");
      return;
    }

    let hash: TransactionHash;
    try {
      hash = address
        ? await writeContract(address, account, functionName, args)
        : await writeRootGuard(account, functionName, args);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Transaction failed.";
      const rejected = /reject|denied|cancelled|canceled/i.test(message);
      update(placeholder, rejected ? "USER_REJECTED" : "RPC_ERROR");
      setError(rejected ? "You rejected the transaction in your wallet." : message);
      return;
    }

    setTransactions((items) =>
      items.map((item) => (item.hash === placeholder ? { hash, label, state: "SUBMITTED", triggered: [] } : item)),
    );
    update(hash, "CONSENSUS_RUNNING");

    try {
      const result = await waitFinalized(account, hash);
      update(hash, "FINALIZED", result.triggered);
      update(hash, "EXECUTION_CONFIRMED", result.triggered);
      update(hash, "STATE_REREAD", result.triggered);
      await onSettled?.();
      update(hash, "DONE", result.triggered);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Transaction failed to finalize.";
      const undetermined = /UNDETERMINED|consensus/i.test(message);
      const executionFailed = /rolled back|execution/i.test(message);
      update(hash, undetermined ? "CONSENSUS_FAILURE" : executionFailed ? "EXECUTION_ERROR" : "STATE_MISMATCH");
      setError(message);
    }
  }

  return { error, transactions, send };
}
