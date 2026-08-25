import { describe, expect, it } from "vitest";
import { parseRecommendationInterpretation } from "./aiRecommendations";

describe("AI recommendation interpretation", () => {
  it("retains a liked title, genre, language, and media type for catalog retrieval", () => {
    expect(parseRecommendationInterpretation(JSON.stringify({ query: "smart Hindi science-fiction films", referenceTitle: "Inception", genreId: 878, mediaType: "movie", originalLanguage: "hi", explanation: "A science-fiction movie request with a Hindi-language preference." }), "fallback")).toEqual({ query: "smart Hindi science-fiction films", referenceTitle: "Inception", genreId: 878, mediaType: "movie", originalLanguage: "hi", explanation: "A science-fiction movie request with a Hindi-language preference." });
  });

  it("uses a bounded fallback and removes invalid retrieval filters", () => {
    expect(parseRecommendationInterpretation(JSON.stringify({ query: "", referenceTitle: "", genreId: -2, mediaType: "unknown", originalLanguage: "hindi", explanation: "" }), "warm films like a favorite")).toEqual({ query: "warm films like a favorite", referenceTitle: null, genreId: null, mediaType: "all", originalLanguage: null, explanation: "Catalog filters interpreted from your request." });
  });

  it("rejects malformed output rather than producing fabricated filters", () => {
    expect(parseRecommendationInterpretation("not-json", "a thriller")).toBeNull();
  });
});
