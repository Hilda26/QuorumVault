# Quorum Vault

**A GenLayer Intelligent Contract governance system for AI-consensus-reviewed code amendments, with a bounded objection window and exact-digest binding.**

**Live app:** https://quorum-vault-gamma.vercel.app
**Contract (StudioNet):** [`0x909c2d556De1684ce419a3e78b22Aa1E509636C0`](https://explorer-studio.genlayer.com/address/0x909c2d556De1684ce419a3e78b22Aa1E509636C0)

## What it is

Quorum Vault lets a "vault" (any GenLayer contract, called a *member*) hand exclusive custody of its own code-replacement entrypoint to the `QuorumVault` contract. From then on, changing that member's code requires:

1. A signer drafts an amendment, pointing at commit-pinned candidate source.
2. GenLayer validator consensus independently fetches the vault's current source and the draft, and weighs the amendment against the vault's plain-English policy -- checking storage-layout compatibility, custody preservation, asset movement, call surface, and policy alignment.
3. A clean pass produces a numeric risk score and five structured safety gates. Only when certainty is medium/high, the risk score is 35 or under, and every gate passes does the amendment clear for install.
4. Cleared amendments enter a bounded **objection window** (5 minutes to 7 days) during which anyone can raise one on-chain objection with evidence, forcing a re-weigh.
5. After the window, Quorum Vault re-fetches and digest-checks the draft one more time before queueing the install, then confirms only after reading the member's live release back.

Every fetch is snapshotted once, at the moment it matters (drafting, objecting), so nobody can edit a page after the other side has already answered it.

## Contracts

- [`contracts/QuorumVault.py`](contracts/QuorumVault.py) -- the governance contract.
- [`contracts/VaultCounter.py`](contracts/VaultCounter.py) -- an example member contract implementing the `VaultMember` interface (`get_release`, `get_keeper`, `get_custodian`, `has_exclusive_custodian`, `apply_release`).

## Frontend

Next.js (App Router), TypeScript strict, Tailwind, `genlayer-js` targeting GenLayer StudioNet. Dark "vault" visual system: hard borders, offset shadows, a condensed display face for headlines, monospace for on-chain data. Full transaction lifecycle tracking (`AWAITING_SIGNATURE -> ... -> DONE`, with named failure states), wrong-network guarding, and a pre-signature contract preview on the enrollment form.

## Quality gates

```bash
python -m pytest tests/direct -q
npx tsc --noEmit
npx eslint .
npm run test
npm run build
```

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Fill in `.env.local` with your deployed `QuorumVault` and member contract addresses.
