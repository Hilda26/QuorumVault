# Quorum Vault -- Submission Notes

Quorum Vault is a GenLayer Intelligent Contract governance system: a vault hands exclusive custody of its
code-replacement entrypoint to `QuorumVault`, and from then on every code change to that vault goes through
AI-consensus review against a plain-English policy, a numeric risk score plus five structured safety gates,
and a bounded on-chain objection window before it can install.

**Live app:** https://quorum-vault-gamma.vercel.app
**Source:** https://github.com/Hilda26/QuorumVault

## Deployed contracts (StudioNet)

Canonical network:

```text
Chain ID: 61999
RPC:      https://studio.genlayer.com/api
Explorer: https://explorer-studio.genlayer.com
Currency: GEN
```

| Contract | Address | Explorer |
| --- | --- | --- |
| `QuorumVault` | `0x909c2d556De1684ce419a3e78b22Aa1E509636C0` | https://explorer-studio.genlayer.com/address/0x909c2d556De1684ce419a3e78b22Aa1E509636C0 |
| `VaultCounter` (example member) | `0x34dfd83798AA2040356f0AeDEB584DAeFb39293e` | https://explorer-studio.genlayer.com/address/0x34dfd83798AA2040356f0AeDEB584DAeFb39293e |

Both were deployed manually through GenLayer Studio (this environment held no funded signer of its own),
and are wired to each other via `VaultCounter.custodian == QuorumVault.address`, confirmed live below.

### Source evidence

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `contracts/QuorumVault.py` | 40273 | `d16dc5a4c870fc9fc498f1a694229bf539ba44163fe91e10e00aef1ebf066db3` |
| `contracts/VaultCounter.py` | 2571 | `d76f3fe91c3a6f62030e735b80cf1887611cccf22691c5123e961e7a6071d453` |

These are tied to the exact byte content of both files as of the commit that introduced them
(`1af7774309a66578721f83ad2b02d272622e25aa`). Recompute with:

```bash
python -c "import hashlib; d=open('contracts/QuorumVault.py','rb').read(); print(len(d), hashlib.sha256(d).hexdigest())"
```

### Method surface

- `QuorumVault.py`: **17 methods** (6 view, 11 write). Static lint passes 3/3; full local schema validation
  is blocked only by a missing SDK cache path on this machine (`E101`, reproduced identically against the
  untouched reference contract this project's frontend originally read from, ruling out a code issue) --
  actual deployment through GenLayer Studio and a real integration test (below) are the stronger proof this
  is unaffected.
- `VaultCounter.py`: **8 methods** (5 view, 3 write).

## What makes it different

- **Snapshot-at-submission.** A draft's source is fetched and digested once, when it is drafted, and again
  at review time -- both digests must match before an amendment can clear or install. Nobody can edit a page
  after the vault's keeper has already seen it.
- **Deterministic backstop over the AI verdict.** The reviewer's own "CLEAR" verdict is downgraded to
  "INCONCLUSIVE" unless the five structured boolean gates (`layout_preserved`, `custody_preserved`,
  `no_asset_motion`, `calls_unchanged`, `policy_aligned`) and a risk score of 35 or under independently agree.
  The model's opinion alone is never sufficient.
- **Bounded objection window with a single-use, evidence-bound challenge.** Anyone can force a re-weigh once,
  with fetched evidence hashed and snapshotted before any state changes.
- **Hard-fail on missing determinism.** Every timestamp read requires GenVM's message-level datetime; there is
  no silent fallback to local wall-clock, closing a class of non-determinism risk.

## Measured results

Lint clean, source verified pure ASCII. 3/3 local contract tests passing (deploy, wallet-role lookups, and
Studio's known integer-encoded-address edge case, reproduced and fixed). 16/16 frontend tests passing.
Clean `tsc --noEmit`, clean `eslint`, clean production build. One real StudioNet integration test, run
against freshly deployed contracts with real GenVM validator consensus and a real fetched source URL --
not a mock:

```
python -m pytest tests/direct -q          # 3 passed
npm run test                              # 16 passed
npx tsc --noEmit && npx eslint . && npm run build   # all clean
python -m pytest tests/integration -v -s  # 1 passed in 264.71s (0:04:24)
```

The integration test deploys `QuorumVault` and `VaultCounter` fresh, calls `request_join` (which fires the
real founding-review AI-consensus round against the *actually pinned* `VaultCounter.py` source at commit
`1af7774309a66578721f83ad2b02d272622e25aa` in this repo), waits for the resulting asynchronous
`join_vault` child transaction to finalize, then asserts the vault's on-chain record (`slug`, `open`,
`release`, `member_address`, `exclusive_custodian`) is exactly correct -- and finally exercises a normal
write (`tick`) to confirm ordinary state still updates. Every transaction hash is printed as evidence in the
test output, matching the standard of proof used for prior GenLayer submissions in this line of work:
real deployed addresses, real consensus, assertions on final on-chain state, nothing mocked.

### Live proof (real StudioNet transactions, from the integration test run)

This is a separate, freshly-deployed pair from the addresses above (the integration test always deploys its
own fixtures so it never depends on -- or mutates -- production state), run end to end with real GenVM
validator consensus:

| Step | Address / Tx |
| --- | --- |
| `QuorumVault` deploy | `0x08961d31eD0bcEA652C8240EbBC19e9dD524Ad31` |
| `VaultCounter` deploy | `0x76E164dfE0A59bCd66E6e7665Ce0A9621941f304` |
| `request_join` (parent tx) | `0x1b226332ff779e73a0ab54ec8d5f686a705b951826baeab4afee726a34998ae9` |
| `join_vault` (async triggered child, waited on and confirmed FINALIZED) | `0x194a42ca3179fd040dffdb5e440c3725a00bc022b147d1e9e70c00e122dedc3d` |
| `tick` (ordinary write, post-enrollment sanity check) | `0xe15dadaa23d08e1519bb998b3190bdafef57c2aff995860afd989ea316a5d229` |

All five results were `MAJORITY_AGREE` at real GenVM validator consensus, finalized on Studionet. After the
run, `quorum.get_vault("life-test-counter")` was read back and asserted equal to `{"open": true, "release":
"r1", "member_address": <VaultCounter address>, "exclusive_custodian": true}` -- the exact state a correct
implementation must produce, not a status code or a mocked receipt.

## A real bug found and fixed before submission (twice)

1. **Studio's integer-encoded address.** Deploying `VaultCounter` through GenLayer Studio's manual deploy
   form repeatedly failed with `OverflowError: cannot fit 'int' into an index-sized integer`. Studio's UI
   encodes an `address`-typed constructor argument as a plain integer in the transaction calldata rather
   than as hex bytes, and the naive `Address(value)` fallback misread that integer as a byte-length request.
   Fixed with a small `_as_address()` normalizer that unpacks an integer into its 20-byte big-endian form
   before constructing the `Address`, and added a regression test that reproduces the exact failure mode.
2. **Async triggered-transaction race, found only by a real network run.** The first attempt at the
   StudioNet integration test asserted `get_ledger()["vault_total"] == "1"` immediately after
   `request_join` finalized -- and failed, reading `"0"`. `request_join` relays into `QuorumVault.join_vault`
   via an asynchronous `emit(on="finalized")` call; the parent transaction finalizing does not mean the
   triggered child has. No mocked/local test could have caught this, since the local sandbox executes both
   calls synchronously. Fixed by waiting on `wait_triggered_transactions=True` /
   `wait_triggered_transactions_status=FINALIZED` before reading dependent state -- the same pattern the
   frontend's own `waitFinalized` + `triggered_transactions` handling already assumes, now proven correct
   against a real network instead of just assumed.

## How to use it

Connect a wallet, request enrollment from your own member contract's `request_join`, then draft amendments
against it once enrolled. The dashboard, vault list, and amendment lifecycle pages all read live on-chain
state -- no mock or demo data anywhere in the shipped build.
