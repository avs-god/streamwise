import { providerNamesMatch } from "../shared/providers";

export type RecommendationSubscription = {
  id: number;
  providerName: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  renewalDate: Date | null;
  viewingIntent: "watch_now" | "considering" | "keep";
  status?: "active" | "paused" | "cancellation_planned" | "cancelled";
};

export type RecommendationWatchlistItem = {
  id: number;
  title: string;
  plannedFor: "this_week" | "this_month" | "someday";
  providerNames: string[];
  availabilityCheckedAt: Date | null;
};

export type SubscriptionDecision = {
  subscriptionId: number;
  decision: "keep" | "pause" | "cancel";
  title: string;
  currency: string;
  summary: string;
  monthlyCost: number;
  annualCost: number;
  daysUntilRenewal: number | null;
  unlocks: Array<{ title: string; plannedFor: RecommendationWatchlistItem["plannedFor"] }>;
  inputs: {
    plannedTitlesConsidered: number;
    matchedTitles: number;
    userViewingIntent: RecommendationSubscription["viewingIntent"];
    availabilitySnapshotCount: number;
  };
};

export function monthlyEquivalent(price: number, cycle: RecommendationSubscription["billingCycle"]) {
  if (cycle === "quarterly") return price / 3;
  if (cycle === "yearly") return price / 12;
  return price;
}

export function annualEquivalent(price: number, cycle: RecommendationSubscription["billingCycle"]) {
  if (cycle === "quarterly") return price * 4;
  if (cycle === "yearly") return price;
  return price * 12;
}

function daysUntil(date: Date | null, now: Date) {
  if (!date) return null;
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export function buildSubscriptionDecisions(
  subscriptions: RecommendationSubscription[],
  watchlist: RecommendationWatchlistItem[],
  now = new Date(),
): SubscriptionDecision[] {
  return subscriptions.filter(subscription => subscription.status !== "cancelled").map(subscription => {
    const unlocks = watchlist
      .filter(item => item.providerNames.some(name => providerNamesMatch(name, subscription.providerName)))
      .map(item => ({ title: item.title, plannedFor: item.plannedFor }));
    const thisWeek = unlocks.filter(item => item.plannedFor === "this_week").length;
    const thisMonth = unlocks.filter(item => item.plannedFor === "this_month").length;
    const someday = unlocks.filter(item => item.plannedFor === "someday").length;
    const renewalDays = daysUntil(subscription.renewalDate, now);
    const monthlyCost = monthlyEquivalent(subscription.price, subscription.billingCycle);
    const annualCost = annualEquivalent(subscription.price, subscription.billingCycle);
    const snapshotCount = watchlist.filter(item => item.availabilityCheckedAt).length;

    let decision: SubscriptionDecision["decision"] = "pause";
    let summary = "No imminent saved viewing is tied to this service, so pausing is worth considering.";

    if (subscription.viewingIntent === "keep" || thisWeek > 0 || thisMonth >= 2) {
      decision = "keep";
      summary = thisWeek > 0
        ? `${thisWeek} saved title${thisWeek === 1 ? "" : "s"} planned for this week is available through this service.`
        : thisMonth >= 2
          ? `${thisMonth} saved titles planned for this month are available through this service.`
          : "You marked this service as intentionally retained; Streamwise is not using any external spending data.";
    } else if (unlocks.length === 0 && renewalDays !== null && renewalDays >= 0 && renewalDays <= 14) {
      decision = "cancel";
      summary = `No saved title currently matches this service and its renewal is in ${renewalDays} day${renewalDays === 1 ? "" : "s"}. Review the provider’s terms before the renewal date.`;
    } else if (unlocks.length === 0) {
      decision = "pause";
      summary = "No saved title currently matches this service. Streamwise suggests a pause rather than assuming that you should cancel.";
    } else if (someday > 0 || subscription.viewingIntent === "considering") {
      decision = "pause";
      summary = "This service unlocks only lower-priority or undecided viewing. Revisit it closer to the next renewal.";
    }

    return {
      subscriptionId: subscription.id,
      decision,
      title: subscription.providerName,
      currency: subscription.currency,
      summary,
      monthlyCost,
      annualCost,
      daysUntilRenewal: renewalDays,
      unlocks,
      inputs: {
        plannedTitlesConsidered: watchlist.length,
        matchedTitles: unlocks.length,
        userViewingIntent: subscription.viewingIntent,
        availabilitySnapshotCount: snapshotCount,
      },
    };
  });
}
