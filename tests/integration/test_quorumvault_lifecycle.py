import json
from pathlib import Path

from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus
from gltest.utils import extract_contract_address


CONTRACTS = Path(__file__).parents[2] / "contracts"
COMMIT = "1af7774309a66578721f83ad2b02d272622e25aa"
COUNTER_URL = f"https://raw.githubusercontent.com/Hilda26/QuorumVault/{COMMIT}/contracts/VaultCounter.py"
POLICY = (
    "Only clear amendments that preserve the declared storage layout, keep this vault's custodian as the "
    "sole release authority, retain public reads, move no assets, and truthfully expose the drafted release."
)


def _hash(receipt):
    return str(receipt.get("hash") or receipt.get("transaction_hash") or receipt.get("tx_hash") or receipt.get("tx_id") or "UNKNOWN")


def _record(label, receipt):
    print(f"QUORUMVAULT_EVIDENCE {label}={_hash(receipt)}")
    print(
        "QUORUMVAULT_RECEIPT "
        + json.dumps(
            {
                "label": label,
                "result_name": receipt.get("result_name"),
                "execution_result": receipt.get("execution_result"),
                "triggered_transactions": receipt.get("triggered_transactions", []),
            },
            default=str,
            sort_keys=True,
        )
    )


def _deploy(factory, args):
    receipt = factory.deploy_contract_tx(
        args=args,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(receipt), receipt
    return factory.build_contract(contract_address=extract_contract_address(receipt)), receipt


def test_quorumvault_join_vault_full_finalized_lifecycle_on_studionet():
    """Real StudioNet proof: deploy both contracts fresh, run a real AI-consensus
    founding review against a real fetched source URL, and confirm the vault
    exists on-chain with the correct keeper/release/custodian invariants --
    the same standard of proof used for the RootGuard fork this project
    replaced (deployed contracts, real consensus, assertions on final state,
    not mocked calls)."""
    quorum_factory = get_contract_factory(contract_file_path=CONTRACTS / "QuorumVault.py")
    counter_factory = get_contract_factory(contract_file_path=CONTRACTS / "VaultCounter.py")

    quorum, quorum_deploy = _deploy(quorum_factory, [900])
    _record("QUORUMVAULT_DEPLOY", quorum_deploy)
    counter, counter_deploy = _deploy(counter_factory, [quorum.address])
    _record("VAULTCOUNTER_DEPLOY", counter_deploy)
    print(f"QUORUMVAULT_EVIDENCE QUORUMVAULT_ADDRESS={quorum.address}")
    print(f"QUORUMVAULT_EVIDENCE VAULTCOUNTER_ADDRESS={counter.address}")
    print(f"QUORUMVAULT_EVIDENCE COMMIT={COMMIT}")
    print(f"QUORUMVAULT_EVIDENCE COUNTER_URL={COUNTER_URL}")

    assert counter.get_release(args=[]).call() == "r1"
    assert counter.has_exclusive_custodian(args=[]).call() is True

    join = counter.request_join(
        args=["life-test-counter", "Life Test Counter", POLICY, COUNTER_URL],
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=180,
        wait_triggered_transactions=True,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(join), join
    assert join.get("triggered_transactions"), join
    _record("REQUEST_JOIN", join)
    print(f"QUORUMVAULT_EVIDENCE JOIN_VAULT_CHILD={join['triggered_transactions'][0]}")

    ledger = quorum.get_ledger(args=[]).call()
    assert ledger["vault_total"] == "1"

    vault = quorum.get_vault(args=["life-test-counter"]).call()
    assert vault["slug"] == "life-test-counter"
    assert vault["open"] is True
    assert vault["release"] == "r1"
    assert vault["member_address"].lower() == counter.address.lower()
    assert vault["exclusive_custodian"] is True

    tick = counter.tick(args=[]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180
    )
    assert tx_execution_succeeded(tick), tick
    _record("TICK", tick)
    assert counter.get_tally(args=[]).call() == "1"
