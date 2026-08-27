import { describe, expect, it } from "vitest";
import { getCatalogDetail, setCatalogAccessTokenForTests } from "./catalog";

describe("live legal-offer comparison", () => {
  it("returns separately labelled TMDb/JustWatch, Watchmode, and Streaming Availability offers for a mapped India title", async () => {
    setCatalogAccessTokenForTests(null);
    const result = await getCatalogDetail({ id: 27205, mediaType: "movie", region: "IN", language: "en-US" });
    expect(result.configured).toBe(true);
    expect(result.title?.offers.every(offer => offer.source === "TMDb / JustWatch" && Boolean(offer.webUrl))).toBe(true);
    expect(["available", "unavailable"]).toContain(result.title?.watchmodeStatus);
    if (result.title?.watchmodeStatus === "available") {
      expect(result.title.watchmodeOffers.length).toBeGreaterThan(0);
      expect(result.title.watchmodeOffers.every(offer => offer.source === "Watchmode" && Boolean(offer.webUrl))).toBe(true);
    }
    expect(["available", "unavailable", "not_configured"]).toContain(result.title?.streamingAvailabilityStatus);
    if (result.title?.streamingAvailabilityStatus === "available") {
      expect(result.title.streamingAvailabilityOffers.length).toBeGreaterThan(0);
      expect(result.title.streamingAvailabilityOffers.every(offer => offer.source === "Streaming Availability by Movie of the Night" && Boolean(offer.webUrl))).toBe(true);
    }
  }, 30_000);
});
