from pathlib import Path


SOURCE = Path(__file__).parents[2] / "contracts" / "QuorumVault.py"


def test_risk_score_consensus_uses_bands_not_exact_numbers():
    text = SOURCE.read_text()
    assert "def _risk_score_band" in text
    assert "self._risk_score_band(score)" in text
    assert "return (outcome, certainty, score," not in text


def test_public_objection_has_signer_priority_window():
    text = SOURCE.read_text()
    assert "PUBLIC_OBJECTION_DELAY_SECONDS" in text
    assert "def _may_spend_objection" in text
    assert "Public objections open after the signer priority window" in text
