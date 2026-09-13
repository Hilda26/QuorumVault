import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { existsSync, readFileSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

const address = process.env.NEXT_PUBLIC_QUORUMVAULT_CONTRACT;
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_ENDPOINT ?? "https://studio.genlayer.com/api";
const required = [
  "join_vault", "set_signer", "suspend_vault", "draft_amendment", "weigh_amendment", "raise_objection",
  "reweigh_objection", "withdraw_amendment", "request_install", "retry_install", "confirm_install",
  "get_ledger", "get_vault", "get_amendment", "list_vaults", "list_amendments", "get_wallet_roles",
];

if (!address || /^0x0{40}$/i.test(address)) {
  console.error("Set NEXT_PUBLIC_QUORUMVAULT_CONTRACT to a deployed Quorum Vault address before schema verification.");
  process.exit(1);
}

const client = createClient({ chain: studionet, endpoint });
const schema = await client.getContractSchema(address);
const missing = required.filter((method) => !schema.methods[method]);
if (missing.length) {
  console.error(`Quorum Vault schema is missing: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Quorum Vault schema verified: ${required.length} methods present.`);
