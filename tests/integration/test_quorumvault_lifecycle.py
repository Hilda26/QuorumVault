import json
import time
from datetime import datetime
from pathlib import Path

import pytest
from gltest.accounts import create_accounts
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus
from gltest.utils import extract_contract_address
from genlayer_py.exceptions import GenLayerError
from genlayer_py.provider.provider import GenLayerProvider


CONTRACTS = Path(__file__).parents[2] / "contracts"
COMMIT = "9301ff076f7842d4d9c8308aed8e8f7e7d738fe1"
COUNTER_URL = f"https://raw.githubusercontent.com/Hilda26/QuorumVault/{COMMIT}/contracts/VaultCounter.py"
COUNTER_R2_URL = f"https://raw.githubusercontent.com/Hilda26/QuorumVault/{COMMIT}/contracts/VaultCounterR2.py"
OBJECTION_URL = f"https://raw.githubusercontent.com/Hilda26/QuorumVault/{COMMIT}/SUBMISSION.md"
POLICY = (
    "Only clear amendments that preserve the declared storage layout, keep this vault's custodian as the "
    "sole release authority, retain public reads, move no assets, and truthfully expose the drafted release."
)
SUMMARY = (
    "Upgrade the member from r1 to r2 while preserving storage order and exclusive custodian control, keeping "
    "the tally intact, adding a bounded add helper, and truthfully reporting the new r2 release marker."
)
OBJECTION_BRIEF = (
    "This objection is intentionally benign lifecycle evidence: it asks validators to re-check the same policy "
    "against the submitted draft and confirm the amendment remains safe to install after the objection branch."
)
TRANSIENT_RPC_MARKERS = (
    "getaddrinfo failed",
    "NameResolutionError",
    "SSLEOFError",
    "UNEXPECTED_EOF_WHILE_READING",
    "Connection aborted",
    "Connection reset",
    "Read timed out",
    "ConnectTimeout",
)


@pytest.fixture(autouse=True)
def _retry_studionet_transport(monkeypatch):
    original = GenLayerProvider.make_request

    def resilient_make_request(self, method, params):
        for attempt in range(6):
            try:
                return original(self, method, params)
            except GenLayerError as exc:
                message = str(exc)
                if attempt == 5 or not any(marker in message for marker in TRANSIENT_RPC_MARKERS):
                    raise
                print(f"QUORUMVAULT_EVIDENCE RPC_RETRY method={method} attempt={attempt + 1}")
                time.sleep(min(2**attempt, 15))

    monkeypatch.setattr(GenLayerProvider, "make_request", resilient_make_request)


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


def _deploy(factory, args, account):
    receipt = factory.deploy_contract_tx(
        args=args,
        account=account,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(receipt), receipt
    return factory.build_contract(contract_address=extract_contract_address(receipt), account=account), receipt


def _finalized(call, label, triggered=False):
    receipt = call.transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=240,
        wait_triggered_transactions=triggered,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(receipt), receipt
    _record(label, receipt)
    return receipt


def _wait_until(iso_timestamp):
    deadline = int(datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00")).timestamp())
    while True:
        remaining = deadline + 2 - int(time.time())
        if remaining <= 0:
            return
        time.sleep(min(15, remaining))


def test_quorumvault_join_vault_full_finalized_lifecycle_on_studionet():
    """Real StudioNet proof: deploy both contracts fresh, run a real AI-consensus
    founding review against a real fetched source URL, and confirm the vault
    exists on-chain with the correct keeper/release/custodian invariants --
    the same standard of proof used for the RootGuard fork this project
    replaced (deployed contracts, real consensus, assertions on final state,
    not mocked calls)."""
    quorum_factory = get_contract_factory(contract_file_path=CONTRACTS / "QuorumVault.py")
    counter_factory = get_contract_factory(contract_file_path=CONTRACTS / "VaultCounter.py")
    counter_r2_factory = get_contract_factory(contract_file_path=CONTRACTS / "VaultCounterR2.py")
    keeper = create_accounts(1)[0]

    quorum, quorum_deploy = _deploy(quorum_factory, [300], keeper)
    _record("QUORUMVAULT_DEPLOY", quorum_deploy)
    counter, counter_deploy = _deploy(counter_factory, [quorum.address], keeper)
    _record("VAULTCOUNTER_DEPLOY", counter_deploy)
    print(f"QUORUMVAULT_EVIDENCE QUORUMVAULT_ADDRESS={quorum.address}")
    print(f"QUORUMVAULT_EVIDENCE VAULTCOUNTER_ADDRESS={counter.address}")
    print(f"QUORUMVAULT_EVIDENCE REGISTERED_SIGNER={keeper.address}")
    print(f"QUORUMVAULT_EVIDENCE COMMIT={COMMIT}")
    print(f"QUORUMVAULT_EVIDENCE COUNTER_URL={COUNTER_URL}")
    print(f"QUORUMVAULT_EVIDENCE COUNTER_R2_URL={COUNTER_R2_URL}")

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

    draft = _finalized(
        quorum.draft_amendment(args=["life-test-r2", "life-test-counter", COUNTER_R2_URL, "r2", SUMMARY]),
        "DRAFT_AMENDMENT",
    )
    submitted = quorum.get_amendment(args=["life-test-r2"]).call()
    assert submitted["stage"] == "PENDING_REVIEW"
    assert submitted["draft_digest_at_submit"]
    print(f"QUORUMVAULT_EVIDENCE DRAFT_AMENDMENT_TX={_hash(draft)}")

    _finalized(quorum.weigh_amendment(args=["life-test-r2"]), "WEIGH_AMENDMENT")
    weighed = quorum.get_amendment(args=["life-test-r2"]).call()
    assert weighed["stage"] == "OBJECTION_WINDOW", weighed
    assert weighed["outcome"] == "CLEAR", weighed
    assert weighed["certainty"] in ("MEDIUM", "HIGH"), weighed
    assert int(weighed["risk_score"]) <= 35, weighed
    assert weighed["layout_preserved"] is True
    assert weighed["custody_preserved"] is True
    assert weighed["no_asset_motion"] is True
    assert weighed["calls_unchanged"] is True
    assert weighed["policy_aligned"] is True
    print(f"QUORUMVAULT_EVIDENCE OBJECTION_DEADLINE={weighed['objection_deadline']}")

    _finalized(
        quorum.raise_objection(args=["life-test-r2", OBJECTION_URL, OBJECTION_BRIEF]),
        "RAISE_OBJECTION",
    )
    objected = quorum.get_amendment(args=["life-test-r2"]).call()
    assert objected["stage"] == "OBJECTED", objected
    assert objected["objection_spent"] is True
    assert objected["objection_digest"]

    _finalized(quorum.reweigh_objection(args=["life-test-r2"]), "REWEIGH_OBJECTION")
    reweighed = quorum.get_amendment(args=["life-test-r2"]).call()
    assert reweighed["stage"] == "OBJECTION_WINDOW", reweighed
    assert reweighed["outcome"] == "CLEAR", reweighed
    assert int(reweighed["risk_score"]) <= 35, reweighed
    print(f"QUORUMVAULT_EVIDENCE REWEIGH_DEADLINE={reweighed['objection_deadline']}")

    _wait_until(reweighed["objection_deadline"])

    install = _finalized(quorum.request_install(args=["life-test-r2"]), "REQUEST_INSTALL", triggered=True)
    assert install.get("triggered_transactions"), install
    print(f"QUORUMVAULT_EVIDENCE APPLY_RELEASE_CHILD={install['triggered_transactions'][0]}")

    counter_r2 = counter_r2_factory.build_contract(contract_address=counter.address, account=keeper)
    assert counter_r2.get_tally(args=[]).call() == "1"
    assert counter_r2.get_release(args=[]).call() == "r2"
    assert counter_r2.get_release_marker(args=[]).call() == "QUORUMVAULT_R2_CONFIRMED"
    add = _finalized(counter_r2.add(args=[5]), "R2_ADD")
    print(f"QUORUMVAULT_EVIDENCE R2_ADD_TX={_hash(add)}")
    assert counter_r2.get_tally(args=[]).call() == "6"

    _finalized(quorum.confirm_install(args=["life-test-r2"]), "CONFIRM_INSTALL")
    installed = quorum.get_amendment(args=["life-test-r2"]).call()
    final_vault = quorum.get_vault(args=["life-test-counter"]).call()
    ledger_after_install = quorum.get_ledger(args=[]).call()
    assert installed["stage"] == "INSTALLED", installed
    assert final_vault["release"] == "r2"
    assert final_vault["source_ref"] == COUNTER_R2_URL
    assert final_vault["open_amendment"] == ""
    assert ledger_after_install["installed_total"] == "1"
