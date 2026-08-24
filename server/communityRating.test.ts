import { describe, expect, it } from "vitest";
import { summarizeCommunityRatings } from "./db";

describe("community title rating aggregation", () => {
  it("returns an honest empty summary without inventing a rating", () => {
    expect(summarizeCommunityRatings([])).toEqual({ count: 0, average: null });
  });

  it("rounds the member aggregate to one decimal place", () => {
    expect(summarizeCommunityRatings([5, 4, 4])).toEqual({ count: 3, average: 4.3 });
  });
});
