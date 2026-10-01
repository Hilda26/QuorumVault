# Quorum Vault -- Resubmission Notes

Quorum Vault is a GenLayer Intelligent Contract governance system: a member contract hands exclusive custody
of its code-replacement entrypoint to `QuorumVault`, and every later code amendment must pass AI-validator
consensus, deterministic thresholding, an objection window, install, and final on-chain confirmation.

**Live app:** https://quorum-vault-gamma.vercel.app
**Source:** https://github.com/Hilda26/QuorumVault

## Review response

1. **End-to-end install proof added.** The StudioNet integration test now runs the full path from a registered
   signer: `draft_amendment -> weigh_amendment -> raise_objection -> reweigh_objection -> objection window
   elapsed -> request_install -> member code replacement -> r2 behavior check -> confirm_install`.
2. **Integration coverage expanded.** `tests/integration/test_quorumvault_lifecycle.py` covers amendment weigh,
   objection/reweigh, install, r2 method execution, and confirm. It uses real StudioNet consensus and fetched
   raw GitHub sources.
3. **Public objection cannot be instantly exhausted.** `raise_objection` now gives the keeper and registered
   signers a priority period before unrelated public callers can spend the single objection.
4. **LLM risk score comparison relaxed.** Leader/challenger equivalence compares `risk_score` by tolerance
   bands while preserving the hard install threshold: `35` and lower clears, `36` and above does not.
5. **RootGuard provenance cleaned up.** Frontend write helpers and error strings now use Quorum Vault naming;
   remaining RootGuard files are unrelated local leftovers and are not part of this submission.

## Deployed proof from clean StudioNet lifecycle run

Canonical network:

```text
Chain ID: 61999
RPC:      https://studio.genlayer.com/api
Explorer: https://explorer-studio.genlayer.com
Currency: GEN
```

Fresh contracts deployed by the passing integration test:

| Contract | Address |
| --- | --- |
| `QuorumVault` | `0x252e79Fe1Aa89de909Ff3bD09a53d6b7Bc9A2fBA` |
| `VaultCounter` member | `0xb5684e0424a58eDa7d27D00D57B6BCE2F754438D` |
| Registered signer used for the run | `0x1CC2eC365b432a5C4bc02A896f44780fdb3f9A44` |

Pinned source URLs used by validators:

| Source | URL |
| --- | --- |
| r1 member source | `https://raw.githubusercontent.com/Hilda26/QuorumVault/9301ff076f7842d4d9c8308aed8e8f7e7d738fe1/contracts/VaultCounter.py` |
| r2 amendment source | `https://raw.githubusercontent.com/Hilda26/QuorumVault/9301ff076f7842d4d9c8308aed8e8f7e7d738fe1/contracts/VaultCounterR2.py` |

Final passing run:

```text
python -m pytest tests/integration/test_quorumvault_lifecycle.py -q -s
1 passed in 1118.63s (0:18:38)
```

Transaction evidence from that run:

| Step | Tx |
| --- | --- |
| `QuorumVault` deploy | `0xd94957e48a1c97f38fdf65b42577e6f0e9ba908b7fdace16394c87916837d485` |
| `VaultCounter` deploy | `0x72372370edc2a03c1aad996e31e93eac1fa27643be18567d3901507a0c55e2ce` |
| `request_join` parent | `0x28a85314dfadc7ce69e7e2f5bc8e6204e50c7284dcb9103378665610fdacf4af` |
| `join_vault` triggered child | `0xc9b480efd384d5be8078b88bedee1c11439bfd429d19c4d4649d287ade8a385b` |
| `tick` before amendment | `0x60563dbebe3b969a60240ce572d356a19fbac540b06f089d3b7f2ff606e13473` |
| `draft_amendment` | `0xfaf00cc64c7314f2089fc604016ef135eabb73b6a157ac12bc387e1ce6c71b3a` |
| `weigh_amendment` | `0xa892f517f68082efbc983b882395b75f7ada12d3c3d9c70902040065fb735557` |
| `raise_objection` | `0x23214adc4bf526da122a84f13410373059778ba78d2c18e34bc7c10bab2be18c` |
| `reweigh_objection` | `0xafe9935ca258bea86625bf989f28d9f83844e37e9d4606ecd9db3a93cdd993d4` |
| `request_install` | `0x33d5c8553d7eff7f017d884e562428ba16785d3a91389fa4c1f092d5be8f406d` |
| `apply_release` triggered child | `0x7605a7f7ab6ec42cebe92cd06066c7fcb18d2a1dd27610a7b4760002950fb446` |
| r2-only `add(5)` after install | `0x4b31fe35d5b54e966b01faa1f3359a38472ce28533455a614755a786e429262c` |
| `confirm_install` | `0x079df00c3a1d9ed2f8f3f5fa332fe0dc0c0f6193a4f9e585be8931969eb3a359` |

The test asserts the member release changes from `r1` to `r2`, `get_release_marker()` returns
`QUORUMVAULT_R2_CONFIRMED`, the pre-upgrade tally is preserved, the r2 `add(5)` method changes tally from
`1` to `6`, and `QuorumVault.confirm_install` records the amendment as `INSTALLED` with
`installed_total == "1"`.

## Source evidence

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `contracts/QuorumVault.py` | 41613 | `2987ca395ecc331f4086101390242074382eb9115b7f1ce774dd372e3429275a` |
| `contracts/VaultCounter.py` | 2571 | `d76f3fe91c3a6f62030e735b80cf1887611cccf22691c5123e961e7a6071d453` |
| `contracts/VaultCounterR2.py` | 2323 | `2608a1d996843dad9e934dbc786ec09d2034f1c4028986b2330934beb8fc36de` |

Recompute with:

```bash
python -c "import hashlib; from pathlib import Path; [print(f'{f} {Path(f).stat().st_size} {hashlib.sha256(Path(f).read_bytes()).hexdigest()}') for f in ['contracts/QuorumVault.py','contracts/VaultCounter.py','contracts/VaultCounterR2.py']]"
```

## Quality gates

```text
genvm-lint check contracts\QuorumVault.py --json
{"ok":true,"lint":{"ok":true,"passed":3},"validate":{"ok":true,"contract":"QuorumVault","methods":17,"view_methods":6,"write_methods":11,...}}

python -m pytest tests/direct/test_quorumvault_deploy_check.py tests/direct/test_quorumvault_review_fixes.py -q
3 passed

npm run lint
clean

npm test
16 passed

npm run build
succeeds
```

`pytest tests/direct` is intentionally not used as the resubmission gate in this checkout because unrelated
untracked RootGuard files from an earlier project are present locally; the Quorum-specific direct tests above
are the relevant contract gate.
