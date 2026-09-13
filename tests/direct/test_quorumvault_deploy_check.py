def test_quorumvault_deploys(direct_deploy):
    contract = direct_deploy("contracts/QuorumVault.py", 900)
    ledger = contract.get_ledger()
    assert ledger["vault_total"] == "0"
