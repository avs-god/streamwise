import { describe, expect, it } from "vitest";
import { buildTitleDiscussionHref } from "./TitleDialog";

describe("catalog title discussion link", () => {
  it("retains TMDb identity, media type, and an encoded title for Community prefill", () => {
    expect(buildTitleDiscussionHref({ id: 27205, mediaType: "movie", title: "Inception" })).toBe("/community?tmdbId=27205&mediaType=movie&title=Inception");
    expect(buildTitleDiscussionHref({ id: 1396, mediaType: "tv", title: "A Show & More" })).toBe("/community?tmdbId=1396&mediaType=tv&title=A%20Show%20%26%20More");
  });
});
