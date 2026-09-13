"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_QUORUMVAULT_CONTRACT as `0x${string}` | undefined;
export const VAULTCOUNTER_ADDRESS = process.env.NEXT_PUBLIC_VAULTCOUNTER_CONTRACT as `0x${string}` | undefined;
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_ENDPOINT ?? "https://studio.genlayer.com/api";
const explorer = "https://explorer-studio.genlayer.com";

export type Ledger_ = Record<string, string>;
export type Vault = Record<string, string | boolean>;
export type Amendment = Record<string, string | boolean>;
export type Ledger = { summary: Ledger_; vaults: Vault[]; amendments: Amendment[] };

export const txUrl = (hash: string) => `${explorer}/tx/${hash}`;
export const addressUrl = (address: string) => `${explorer}/address/${address}`;

function client(account?: `0x${string}`) {
  return createClient({ chain: studionet, endpoint, account, provider: typeof window === "undefined" ? undefined : window.ethereum });
}

function configuredAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS || /^0x0{40}$/i.test(CONTRACT_ADDRESS)) throw new Error("QuorumVault contract not configured.");
  return CONTRACT_ADDRESS;
}

export async function readContract<T>(functionName: string, args: CalldataEncodable[] = []): Promise<T> {
  try {
    return await client().readContract({ address: configuredAddress(), functionName, args }) as T;
  } catch (error) {
    throw new Error(`Unable to read Quorum Vault on StudioNet: ${error instanceof Error ? error.message : "RPC request failed."}`);
  }
}

export async function readContractAt<T>(address: `0x${string}`, functionName: string, args: CalldataEncodable[] = []): Promise<T> {
  try {
    return await client().readContract({ address, functionName, args }) as T;
  } catch (error) {
    throw new Error(`Unable to read ${address} on StudioNet: ${error instanceof Error ? error.message : "RPC request failed."}`);
  }
}

export async function loadLedger(): Promise<Ledger> {
  const [summary, vaults, amendments] = await Promise.all([
    readContract<Ledger_>("get_ledger"),
    readContract<Vault[]>("list_vaults", [0n, 50n]),
    readContract<Amendment[]>("list_amendments", ["", 0n, 50n]),
  ]);
  return { summary, vaults, amendments };
}

export async function writeContract(address: `0x${string}`, account: `0x${string}`, functionName: string, args: CalldataEncodable[]) {
  const writer = client(account);
  await writer.connect("studionet");
  return await writer.writeContract({ address, functionName, args, value: 0n, consensusMaxRotations: 3 }) as TransactionHash;
}

export async function writeRootGuard(account: `0x${string}`, functionName: string, args: CalldataEncodable[]) {
  return writeContract(configuredAddress(), account, functionName, args);
}

export async function waitFinalized(account: `0x${string}`, hash: TransactionHash) {
  const writer = client(account);
  await writer.connect("studionet");
  await writer.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 5000, retries: 180 });
  const transaction = await writer.getTransaction({ hash });
  const execution = transaction?.consensus_data?.leader_receipt?.[0]?.execution_result;
  if (execution && execution !== "SUCCESS") throw new Error(`Finalized transaction rolled back (${execution}).`);
  return { transaction, triggered: (transaction as unknown as { triggered_transactions?: string[] } | undefined)?.triggered_transactions ?? [] };
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
