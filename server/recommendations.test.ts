import { describe, expect, it } from "vitest";
import {
  annualEquivalent,
  buildSubscriptionDecisions,
  monthlyEquivalent,
  type RecommendationSubscription,
  type RecommendationWatchlistItem,
} from "./recommendations";

const now = new Date("2026-08-24T12:00:00.000Z");

function subscription(overrides: Partial<RecommendationSubscription> = {}): RecommendationSubscription {
  return {
    id: 1,
    providerName: "Netflix",
    planName: "Standard",
    price: 15,
    currency: "USD",
    billingCycle: "monthly",
    renewalDate: new Date("2026-08-29T12:00:00.000Z"),
    viewingIntent: "considering",
    ...overrides,
  };
}

function title(overrides: Partial<RecommendationWatchlistItem> = {}): RecommendationWatchlistItem {
  return {
    id: 1,
    title: "Planned Film",
    plannedFor: "this_week",
    providerNames: ["Netflix"],
    availabilityCheckedAt: now,
    ...overrides,
  };
}

describe("subscription equivalents", () => {
  it("normalizes monthly, quarterly, and annual pricing without currency conversion", () => {
    expect(monthlyEquivalent(12, "monthly")).toBe(12);
    expect(monthlyEquivalent(30, "quarterly")).toBe(10);
    expect(monthlyEquivalent(120, "yearly")).toBe(10);
    expect(annualEquivalent(12, "monthly")).toBe(144);
    expect(annualEquivalent(30, "quarterly")).toBe(120);
    expect(annualEquivalent(120, "yearly")).toBe(120);
  });
});

describe("transparent subscription decisions", () => {
  it("keeps a service when a saved title is planned for this week", () => {
    const [result] = buildSubscriptionDecisions([subscription()], [title()], now);

    expect(result.decision).toBe("keep");
    expect(result.unlocks).toEqual([{ title: "Planned Film", plannedFor: "this_week" }]);
    expect(result.inputs).toMatchObject({
      plannedTitlesConsidered: 1,
      matchedTitles: 1,
      availabilitySnapshotCount: 1,
      userViewingIntent: "considering",
    });
  });

  it("marks a near-renewal service with no matching saved title as a cancel candidate", () => {
    const [result] = buildSubscriptionDecisions([subscription()], [title({ providerNames: ["MUBI"] })], now);

    expect(result.decision).toBe("cancel");
    expect(result.daysUntilRenewal).toBe(5);
    expect(result.summary).toContain("No saved title currently matches");
  });

  it("suggests a pause for a service that only unlocks a lower-priority title", () => {
    const [result] = buildSubscriptionDecisions(
      [subscription({ providerName: "MUBI", renewalDate: new Date("2026-09-30T12:00:00.000Z") })],
      [title({ providerNames: ["MUBI"], plannedFor: "someday" })],
      now,
    );

    expect(result.decision).toBe("pause");
    expect(result.summary).toContain("lower-priority");
  });

  it("excludes subscriptions the user has already marked cancelled", () => {
    const results = buildSubscriptionDecisions([subscription({ status: "cancelled" })], [title()], now);

    expect(results).toEqual([]);
  });
});
