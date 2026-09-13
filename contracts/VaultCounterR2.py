# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


@gl.contract_interface
class QuorumVaultJoin:
    class Write:
        def join_vault(self, slug: str, label: str, policy: str, source_ref: str) -> None: ...


class VaultCounter(gl.Contract):
    # Storage field order is intentionally identical to VaultCounter (r1).
    keeper: Address
    custodian: Address
    tally: u256
    release: str

    def __init__(self, custodian: Address):
        controller = custodian if isinstance(custodian, Address) else Address(custodian)
        self.keeper = gl.message.sender_address
        self.custodian = controller
        self.tally = u256(0)
        self.release = "r1"
        root = gl.storage.Root.get()
        root.upgraders.get().append(controller)

    @gl.public.write
    def request_join(self, slug: str, label: str, policy: str, source_ref: str) -> None:
        if gl.message.sender_address != self.keeper:
            raise gl.vm.UserError("[EXPECTED] Only the keeper may request custody enrollment")
        QuorumVaultJoin(self.custodian).emit(on="finalized").join_vault(slug, label, policy, source_ref)

    @gl.public.write
    def tick(self) -> None:
        self.tally += u256(1)

    @gl.public.write
    def add(self, amount: u256) -> None:
        self.tally += amount

    @gl.public.write
    def apply_release(self, payload: bytes) -> None:
        if gl.message.sender_address != self.custodian:
            raise gl.vm.UserError("[EXPECTED] Only the vault custodian may replace this member's code")
        code = gl.storage.Root.get().code.get()
        code.truncate()
        code.extend(payload)

    @gl.public.view
    def get_tally(self) -> str:
        return str(self.tally)

    @gl.public.view
    def get_release(self) -> str:
        return "r2"

    @gl.public.view
    def get_custodian(self) -> str:
        return str(self.custodian)

    @gl.public.view
    def get_keeper(self) -> str:
        return str(self.keeper)

    @gl.public.view
    def has_exclusive_custodian(self) -> bool:
        upgraders = gl.storage.Root.get().upgraders.get()
        return len(upgraders) == 1 and upgraders[0] == self.custodian

    @gl.public.view
    def get_release_marker(self) -> str:
        return "QUORUMVAULT_R2_CONFIRMED"
