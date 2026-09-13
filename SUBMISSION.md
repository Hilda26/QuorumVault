# Quorum Vault -- Submission Notes

Quorum Vault is a GenLayer Intelligent Contract governance system: a vault hands exclusive custody of its
code-replacement entrypoint to `QuorumVault`, and from then on every code change to that vault goes through
AI-consensus review against a plain-English policy, a numeric risk score plus five structured safety gates,
and a bounded on-chain objection window before it can install.

## Deployed contracts (StudioNet)

- `QuorumVault`: `0x909c2d556De1684ce419a3e78b22Aa1E509636C0`
- `VaultCounter` (example member): `0x34dfd83798AA2040356f0AeDEB584DAeFb39293e`

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

## Quality gates (all passing)

```
python -m pytest tests/direct -q        # 3 contract tests -- deploy, roles, and Studio's known
                                          # integer-encoded-address edge case
npx tsc --noEmit                         # clean
npx eslint .                             # clean
npm run test                             # 16 frontend tests
npm run build                            # clean production build
```

## A real bug found and fixed before submission

Deploying `VaultCounter` through GenLayer Studio's manual deploy form repeatedly failed with
`OverflowError: cannot fit 'int' into an index-sized integer`. Studio's UI encodes an `address`-typed
constructor argument as a plain integer in the transaction calldata rather than as hex bytes, and the naive
`Address(value)` fallback misread that integer as a byte-length request. Fixed with a small `_as_address()`
normalizer that unpacks an integer into its 20-byte big-endian form before constructing the `Address`, and
added a regression test that reproduces the exact failure mode (an address passed as a raw Python `int`)
to prove the fix holds.

## How to use it

Connect a wallet, request enrollment from your own member contract's `request_join`, then draft amendments
against it once enrolled. The dashboard, vault list, and amendment lifecycle pages all read live on-chain
state -- no mock or demo data anywhere in the shipped build.
