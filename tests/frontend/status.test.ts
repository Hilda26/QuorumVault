import { describe, expect, it } from "vitest";
import { statusTone } from "@/lib/contract/status";

describe("statusTone", () => {
  it("marks installed / cleared-for-install stages green", () => {
    expect(statusTone("INSTALLED")).toBe("green");
    expect(statusTone("OBJECTION_WINDOW")).toBe("green");
    expect(statusTone("INSTALL_PENDING")).toBe("green");
  });

  it("marks in-review stages amber", () => {
    expect(statusTone("PENDING_REVIEW")).toBe("amber");
    expect(statusTone("OBJECTED")).toBe("amber");
  });

  it("marks terminal negative stages red", () => {
    expect(statusTone("DENIED")).toBe("red");
    expect(statusTone("INCONCLUSIVE")).toBe("red");
    expect(statusTone("UNGROUNDED")).toBe("red");
    expect(statusTone("WITHDRAWN")).toBe("red");
  });

  it("falls back to amber for an unrecognized stage", () => {
    expect(statusTone("SOMETHING_NEW")).toBe("amber");
  });
});
