def test_vaultcounter_deploys(direct_deploy, direct_bob):
    counter = direct_deploy("contracts/VaultCounter.py", direct_bob)
    assert counter.get_release() == "r1"
    assert counter.has_exclusive_custodian() is True


def test_vaultcounter_deploys_with_integer_encoded_address(direct_deploy, direct_bob):
    """Reproduces the Studio deploy-form bug: an address argument arriving as a
    plain int (not bytes/str/Address) must not crash the constructor."""
    custodian_int = int.from_bytes(direct_bob, "big")
    counter = direct_deploy("contracts/VaultCounter.py", custodian_int)
    assert counter.get_custodian().lower() == ("0x" + direct_bob.hex()).lower()
    assert counter.has_exclusive_custodian() is True
