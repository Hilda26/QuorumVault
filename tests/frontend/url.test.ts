import { describe, expect, it } from "vitest";
import { isCommitPinnedSourceUrl, sourceUrlError } from "@/lib/validation/url";

describe("isCommitPinnedSourceUrl", () => {
  it("accepts a commit-pinned raw.githubusercontent.com URL", () => {
    expect(
      isCommitPinnedSourceUrl(
        "https://raw.githubusercontent.com/example/example/e499c086113ce76aaeae9218efb9691cdd6dab01/contracts/Example.py",
      ),
    ).toBe(true);
  });

  it("accepts a commit-pinned gitlab.com URL", () => {
    expect(
      isCommitPinnedSourceUrl("https://gitlab.com/owner/repo/-/raw/e499c086113ce76aaeae9218efb9691cdd6dab01/x.py"),
    ).toBe(true);
  });

  it("accepts a commit-pinned codeberg.org URL", () => {
    expect(
      isCommitPinnedSourceUrl("https://codeberg.org/owner/repo/raw/commit/e499c086113ce76aaeae9218efb9691cdd6dab01/x.py"),
    ).toBe(true);
  });

  it("rejects a non-allowlisted host", () => {
    expect(isCommitPinnedSourceUrl("https://example.com/not-pinned")).toBe(false);
  });

  it("rejects a branch-pinned (not commit-pinned) URL", () => {
    expect(isCommitPinnedSourceUrl("https://raw.githubusercontent.com/owner/repo/main/contracts/Example.py")).toBe(false);
  });

  it("rejects a short or non-hex sha segment", () => {
    expect(isCommitPinnedSourceUrl("https://raw.githubusercontent.com/owner/repo/abc123/contracts/Example.py")).toBe(false);
  });

  it("rejects http (non-https)", () => {
    expect(
      isCommitPinnedSourceUrl("http://raw.githubusercontent.com/owner/repo/e499c086113ce76aaeae9218efb9691cdd6dab01/x.py"),
    ).toBe(false);
  });
});

describe("sourceUrlError", () => {
  it("returns undefined for an empty string (untouched field)", () => {
    expect(sourceUrlError("")).toBeUndefined();
  });

  it("returns undefined for a valid pinned URL", () => {
    expect(
      sourceUrlError("https://raw.githubusercontent.com/owner/repo/e499c086113ce76aaeae9218efb9691cdd6dab01/x.py"),
    ).toBeUndefined();
  });

  it("returns a message for an invalid URL", () => {
    expect(sourceUrlError("https://example.com/x")).toMatch(/commit hash/i);
  });
});
