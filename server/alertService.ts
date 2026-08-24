import { createAlert, getAlertPreferences, getAlerts, getSubscriptions } from "./db";

export type RenewalRecord = {
  id: number;
  providerName: string;
  planName: string;
  renewalDate: Date | null;
  pauseUntil: Date | null;
  status: "active" | "paused" | "cancellation_planned" | "cancelled";
};

export function dueRenewalCandidates(subscriptions: RenewalRecord[], leadDays: number, now = new Date()) {
  return subscriptions.filter(subscription => {
    if (subscription.status === "cancelled" || !subscription.renewalDate) return false;
    const days = Math.ceil((subscription.renewalDate.getTime() - now.getTime()) / 86_400_000);
    return days >= 0 && days <= leadDays;
  }).map(subscription => ({ ...subscription, daysUntilRenewal: Math.ceil((subscription.renewalDate!.getTime() - now.getTime()) / 86_400_000) }));
}

export function duePauseReviewCandidates(subscriptions: RenewalRecord[], now = new Date()) {
  return subscriptions.filter(subscription => subscription.status === "paused" && subscription.pauseUntil && subscription.pauseUntil.getTime() <= now.getTime());
}

function existingKey(payloadJson: string) {
  try { const payload = JSON.parse(payloadJson); return typeof payload?.dedupeKey === "string" ? payload.dedupeKey : null; } catch { return null; }
}

export async function syncRenewalAlerts(userId: number, now = new Date()) {
  const preferences = await getAlertPreferences(userId);
  if (!preferences.inAppEnabled || (!preferences.renewalRemindersEnabled && !preferences.pauseRemindersEnabled)) return { created: 0, skipped: "preference" as const };
  const [subscriptions, existing] = await Promise.all([getSubscriptions(userId), getAlerts(userId)]);
  const existingKeys = new Set(existing.map(item => existingKey(item.payloadJson)).filter((key): key is string => Boolean(key)));
  const candidates = preferences.renewalRemindersEnabled ? dueRenewalCandidates(subscriptions, preferences.renewalLeadDays, now) : [];
  let created = 0;
  for (const subscription of candidates) {
    const dedupeKey = `renewal:${subscription.id}:${subscription.renewalDate!.toISOString()}`;
    if (existingKeys.has(dedupeKey)) continue;
    const timing = subscription.daysUntilRenewal === 0 ? "renews today" : `renews in ${subscription.daysUntilRenewal} day${subscription.daysUntilRenewal === 1 ? "" : "s"}`;
    await createAlert({ userId, type: "renewal_due", title: `Renewal to review: ${subscription.providerName}`, body: `${subscription.planName} ${timing}, based on the date in your wallet. Confirm the provider’s current terms before changing the plan.`, payloadJson: JSON.stringify({ dedupeKey, subscriptionId: subscription.id, renewalDate: subscription.renewalDate }) });
    created += 1;
  }
  if (preferences.pauseRemindersEnabled) {
    const pauseCandidates = duePauseReviewCandidates(subscriptions, now);
    for (const subscription of pauseCandidates) {
      const dedupeKey = `pause:${subscription.id}:${subscription.pauseUntil!.toISOString()}`;
      if (existingKeys.has(dedupeKey)) continue;
      await createAlert({ userId, type: "pause_review", title: `Pause review due: ${subscription.providerName}`, body: `${subscription.planName} has reached the review date you entered when pausing it. Review the provider’s official terms before resuming, cancelling, or changing the plan.`, payloadJson: JSON.stringify({ dedupeKey, subscriptionId: subscription.id, pauseUntil: subscription.pauseUntil }) });
      created += 1;
    }
  }
  return { created, skipped: null };
}
