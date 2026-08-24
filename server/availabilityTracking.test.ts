import { describe, expect, it } from "vitest";
import { compareAvailability, normalizeOffers, offersFingerprint } from "./availabilityTracking";
import { duePauseReviewCandidates, dueRenewalCandidates } from "./alertService";

describe("availability snapshot comparison", () => {
  it("finds added and removed legal offers without inferring a departure date", () => {
    const previous = JSON.stringify([
      { id: 8, name: "Netflix", type: "stream" },
      { id: 2, name: "Apple TV", type: "rent" },
    ]);
    const result = compareAvailability(previous, [
      { id: 8, name: "Netflix", type: "stream" },
      { id: 7, name: "MUBI", type: "stream" },
    ]);

    expect(result.changed).toBe(true);
    expect(result.added).toEqual([{ id: 7, name: "MUBI", type: "stream" }]);
    expect(result.removed).toEqual([{ id: 2, name: "Apple TV", type: "rent" }]);
    expect(result.summary).toContain("added");
    expect(result.summary).toContain("removed");
  });

  it("normalizes duplicate offers to a stable fingerprint", () => {
    const offers = normalizeOffers([{ id: 8, name: " Netflix ", type: "stream" }, { id: 8, name: "Netflix", type: "stream" }]);
    expect(offers).toEqual([{ id: 8, name: "Netflix", type: "stream" }]);
    expect(offersFingerprint(offers)).toBe(JSON.stringify(offers));
  });
});

describe("renewal reminder candidates", () => {
  it("uses only entered renewal dates and excludes cancelled records", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    const candidates = dueRenewalCandidates([
      { id: 1, providerName: "Netflix", planName: "Standard", renewalDate: new Date("2026-08-29T12:00:00.000Z"), pauseUntil: null, status: "active" },
      { id: 2, providerName: "MUBI", planName: "Monthly", renewalDate: new Date("2026-08-26T12:00:00.000Z"), pauseUntil: null, status: "cancelled" },
      { id: 3, providerName: "Prime Video", planName: "Annual", renewalDate: new Date("2026-09-20T12:00:00.000Z"), pauseUntil: null, status: "active" },
    ], 7, now);

    expect(candidates).toEqual([expect.objectContaining({ id: 1, daysUntilRenewal: 5 })]);
  });

  it("surfaces only paused services whose user-entered review date has passed", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    const candidates = duePauseReviewCandidates([
      { id: 1, providerName: "Netflix", planName: "Standard", renewalDate: null, pauseUntil: new Date("2026-08-23T12:00:00.000Z"), status: "paused" },
      { id: 2, providerName: "MUBI", planName: "Monthly", renewalDate: null, pauseUntil: new Date("2026-08-30T12:00:00.000Z"), status: "paused" },
      { id: 3, providerName: "Prime Video", planName: "Annual", renewalDate: null, pauseUntil: new Date("2026-08-20T12:00:00.000Z"), status: "active" },
    ], now);

    expect(candidates).toEqual([expect.objectContaining({ id: 1 })]);
  });
});
