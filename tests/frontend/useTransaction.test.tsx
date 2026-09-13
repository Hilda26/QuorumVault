import { describe, expect, it } from "vitest";
import { isFailureState } from "@/lib/tx/useTransaction";

describe("isFailureState", () => {
  it("treats the six named failure states as failures", () => {
    expect(isFailureState("USER_REJECTED")).toBe(true);
    expect(isFailureState("WRONG_NETWORK")).toBe(true);
    expect(isFailureState("RPC_ERROR")).toBe(true);
    expect(isFailureState("CONSENSUS_FAILURE")).toBe(true);
    expect(isFailureState("EXECUTION_ERROR")).toBe(true);
    expect(isFailureState("STATE_MISMATCH")).toBe(true);
  });

  it("does not treat lifecycle-progress states as failures", () => {
    expect(isFailureState("IDLE")).toBe(false);
    expect(isFailureState("AWAITING_SIGNATURE")).toBe(false);
    expect(isFailureState("SUBMITTED")).toBe(false);
    expect(isFailureState("CONSENSUS_RUNNING")).toBe(false);
    expect(isFailureState("FINALIZED")).toBe(false);
    expect(isFailureState("EXECUTION_CONFIRMED")).toBe(false);
    expect(isFailureState("STATE_REREAD")).toBe(false);
    expect(isFailureState("DONE")).toBe(false);
  });
});
