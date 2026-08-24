import { describe, expect, it } from "vitest";
import { parseTitleSuggestion } from "./catalog";

describe("title query correction", () => {
  it("accepts a distinct bounded title suggestion", () => {
    expect(parseTitleSuggestion('{"query":"Tenet"}', "tencet")).toBe("Tenet");
  });

  it("rejects an unchanged, malformed, or excessively long suggestion", () => {
    expect(parseTitleSuggestion('{"query":"tencet"}', "tencet")).toBeNull();
    expect(parseTitleSuggestion("not-json", "tencet")).toBeNull();
    expect(parseTitleSuggestion(JSON.stringify({ query: "x".repeat(121) }), "tencet")).toBeNull();
  });
});
