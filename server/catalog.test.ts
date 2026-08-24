import { describe, expect, it } from "vitest";
import { getRecommendedCatalogTitles, mergePostWatchRecommendations, parseTitleSuggestion } from "./catalog";

describe("title query correction", () => {
  it("accepts a distinct bounded title suggestion", () => {
    expect(parseTitleSuggestion('{"query":"Tenet"}', "tencet")).toBe("Tenet");
  });

  it("rejects an unchanged, malformed, or excessively long suggestion", () => {
    expect(parseTitleSuggestion('{"query":"tencet"}', "tencet")).toBeNull();
    expect(parseTitleSuggestion("not-json", "tencet")).toBeNull();
    expect(parseTitleSuggestion(JSON.stringify({ query: "x".repeat(121) }), "tencet")).toBeNull();
  });

  it("returns an honest empty post-watch path without a catalog credential", async () => {
    const result = await getRecommendedCatalogTitles({ id: 1, mediaType: "movie", language: "en-US" });
    expect(result).toEqual({ configured: false, titles: [] });
  });

  it("merges post-watch picks deterministically while excluding recorded titles and duplicates", () => {
    const pick = (id: number) => ({ id, mediaType: "movie" as const, title: `Film ${id}`, originalTitle: null, overview: null, posterPath: null, releaseDate: null });
    expect(mergePostWatchRecommendations([{ sourceId: 1, titles: [pick(1), pick(2), pick(3)] }, { sourceId: 2, titles: [pick(3), pick(4)] }], [1])).toEqual([pick(2), pick(3), pick(4)]);
  });
});
