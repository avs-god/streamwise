import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  alertPreferences,
  alerts,
  availabilitySnapshots,
  communityPosts,
  communityReports,
  communityThreadReplies,
  communityThreadReports,
  communityThreads,
  communityTitleRatings,
  InsertUser,
  scheduledJobs,
  subscriptionActions,
  subscriptions,
  users,
  viewingSignals,
  watchlistItems,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

/** Test seam for exercising public query mappings without a live database. */
export function setDbForTests(db: ReturnType<typeof drizzle> | null) {
  _db = db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach(field => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } });
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getOptedInRefreshUserIds(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id }).from(users).innerJoin(alertPreferences, eq(alertPreferences.userId, users.id)).where(eq(alertPreferences.inAppEnabled, true)).limit(limit);
}

export async function getScheduledJobByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(scheduledJobs).where(eq(scheduledJobs.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function upsertScheduledJob(jobKey: string, scheduleCronTaskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(scheduledJobs).values({ jobKey, scheduleCronTaskUid }).onDuplicateKeyUpdate({ set: { scheduleCronTaskUid } });
}

export async function getWatchlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
}

export async function getOwnedWatchlistItem(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(watchlistItems).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId))).limit(1))[0];
}

export type WatchlistInput = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  releaseDate?: string | null;
  plannedFor: "this_week" | "this_month" | "someday";
  note?: string | null;
  monitorAvailability?: boolean;
  availabilityRegion?: string;
  providerNamesJson: string;
  availabilityCheckedAt?: Date | null;
  availabilitySourceUrl?: string | null;
};

export async function addWatchlistItem(userId: number, item: WatchlistInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(watchlistItems).values({ userId, ...item }).onDuplicateKeyUpdate({ set: {
    title: item.title, posterPath: item.posterPath ?? null, releaseDate: item.releaseDate ?? null, plannedFor: item.plannedFor,
    note: item.note ?? null, monitorAvailability: item.monitorAvailability ?? true, availabilityRegion: item.availabilityRegion ?? "US",
    providerNamesJson: item.providerNamesJson, availabilityCheckedAt: item.availabilityCheckedAt ?? null, availabilitySourceUrl: item.availabilitySourceUrl ?? null,
  } });
  return (await db.select().from(watchlistItems).where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, item.tmdbId), eq(watchlistItems.mediaType, item.mediaType))).limit(1))[0];
}

export async function updateWatchlistIntent(userId: number, id: number, plannedFor: "this_week" | "this_month" | "someday") {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(watchlistItems).set({ plannedFor }).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function updateWatchlistNote(userId: number, id: number, note: string | null) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(watchlistItems).set({ note }).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function updateWatchlistMonitoring(userId: number, id: number, monitorAvailability: boolean) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(watchlistItems).set({ monitorAvailability }).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function updateWatchlistAvailability(userId: number, id: number, input: { providerNamesJson: string; checkedAt: Date; sourceUrl: string | null; region: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(watchlistItems).set({ providerNamesJson: input.providerNamesJson, availabilityCheckedAt: input.checkedAt, availabilitySourceUrl: input.sourceUrl, availabilityRegion: input.region }).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function removeWatchlistItem(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.delete(watchlistItems).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function getLatestSnapshot(watchlistItemId: number) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(availabilitySnapshots).where(eq(availabilitySnapshots.watchlistItemId, watchlistItemId)).orderBy(desc(availabilitySnapshots.checkedAt)).limit(1))[0];
}

export async function getSnapshotHistory(userId: number, watchlistItemId: number) {
  const owned = await getOwnedWatchlistItem(userId, watchlistItemId);
  if (!owned) return [];
  const db = await getDb(); if (!db) return [];
  return db.select().from(availabilitySnapshots).where(eq(availabilitySnapshots.watchlistItemId, watchlistItemId)).orderBy(desc(availabilitySnapshots.checkedAt)).limit(12);
}

export async function addAvailabilitySnapshot(input: { watchlistItemId: number; region: string; offersJson: string; fingerprint: string; sourceUrl: string | null; checkedAt: Date }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(availabilitySnapshots).values(input);
}

export async function getAlertPreferences(userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(alertPreferences).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  return (await db.select().from(alertPreferences).where(eq(alertPreferences.userId, userId)).limit(1))[0];
}

export async function updateAlertPreferences(userId: number, input: { availabilityChangesEnabled: boolean; renewalRemindersEnabled: boolean; pauseRemindersEnabled: boolean; renewalLeadDays: number; inAppEnabled: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(alertPreferences).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getAlertPreferences(userId);
}

export async function getAlerts(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt)).limit(60);
}

export async function createAlert(input: { userId: number; type: "availability_changed" | "renewal_due" | "pause_review" | "subscription_action"; title: string; body: string; payloadJson: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(alerts).values(input);
}

export async function markAlertRead(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(alerts).set({ isRead: true }).where(and(eq(alerts.id, id), eq(alerts.userId, userId)));
}

export async function markAllAlertsRead(userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.userId, userId));
}

export async function getSubscriptions(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
}

export type SubscriptionInput = { providerName: string; planName: string; price: string; currency: string; billingCycle: "monthly" | "quarterly" | "yearly"; renewalDate: Date | null; viewingIntent: "watch_now" | "considering" | "keep" };

export async function addSubscription(userId: number, input: SubscriptionInput) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.insert(subscriptions).values({ userId, ...input }); }
export async function updateSubscription(userId: number, id: number, input: SubscriptionInput) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.update(subscriptions).set(input).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))); }
export async function removeSubscription(userId: number, id: number) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))); }

export async function getSubscriptionActions(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(subscriptionActions).where(eq(subscriptionActions.userId, userId)).orderBy(desc(subscriptionActions.actionAt)).limit(80);
}

export async function applySubscriptionAction(userId: number, subscriptionId: number, actionType: "paused" | "resumed" | "cancellation_planned" | "cancelled", note: string | null, pauseUntil: Date | null) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  const subscription = (await db.select().from(subscriptions).where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))).limit(1))[0];
  if (!subscription) throw new Error("Subscription not found.");
  const now = new Date();
  const patch = actionType === "paused" ? { status: "paused" as const, pauseUntil, cancellationRequestedAt: null, endedAt: null } : actionType === "resumed" ? { status: "active" as const, pauseUntil: null, cancellationRequestedAt: null, endedAt: null } : actionType === "cancellation_planned" ? { status: "cancellation_planned" as const, pauseUntil: null, cancellationRequestedAt: now, endedAt: null } : { status: "cancelled" as const, pauseUntil: null, cancellationRequestedAt: subscription.cancellationRequestedAt ?? now, endedAt: now };
  await db.update(subscriptions).set(patch).where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)));
  await db.insert(subscriptionActions).values({ userId, subscriptionId, actionType, note });
}

export type CommunityPostInput = {
  tmdbId?: number | null;
  title: string;
  mediaType: "movie" | "tv" | "unknown";
  region: string;
  providerName: string | null;
  reportedLeavingAt?: Date | null;
  switchesToProviderName?: string | null;
  kind: "available" | "ppv" | "leaving_soon" | "review" | "recommendation";
  body: string;
  sourceUrl: string | null;
  shareAttribution: boolean;
};

export function toPublicCommunityItem<T extends { userId: number; shareAttribution: boolean }>(item: T, contributorName: string | null) {
  const { userId: _userId, ...publicItem } = item;
  return { ...publicItem, contributorName: item.shareAttribution ? contributorName ?? "Streamwise member" : null };
}

export async function createCommunityPost(userId: number, input: CommunityPostInput) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(communityPosts).values({ userId, ...input });
}

export type ViewingSignalInput = { tmdbId: number; mediaType: "movie" | "tv"; title: string };

/** A signal exists only when its owner actively records it. It is never inferred from community or provider data. */
export async function recordViewingSignal(userId: number, input: ViewingSignalInput) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  const recordedAt = new Date();
  await db.insert(viewingSignals).values({ userId, ...input, status: "watched", recordedAt }).onDuplicateKeyUpdate({ set: { title: input.title, status: "watched", recordedAt } });
}

export async function getViewingSignals(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(viewingSignals).where(eq(viewingSignals.userId, userId)).orderBy(desc(viewingSignals.recordedAt)).limit(100);
}

export async function removeViewingSignal(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.delete(viewingSignals).where(and(eq(viewingSignals.id, id), eq(viewingSignals.userId, userId)));
}

export async function getCommunityPosts(input: { region?: string; kind?: CommunityPostInput["kind"] }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(communityPosts.status, "visible")];
  if (input.region) conditions.push(eq(communityPosts.region, input.region));
  if (input.kind) conditions.push(eq(communityPosts.kind, input.kind));
  const rows = await db.select({ post: communityPosts, contributorName: users.name }).from(communityPosts).leftJoin(users, eq(communityPosts.userId, users.id)).where(and(...conditions)).orderBy(desc(communityPosts.createdAt)).limit(80);
  return rows.filter(({ post }) => post.status === "visible").map(({ post, contributorName }) => toPublicCommunityItem(post, contributorName));
}

export async function reportCommunityPost(userId: number, postId: number, input: { reason: "misleading" | "spam" | "abuse" | "privacy" | "other"; detail: string | null }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  const post = (await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1))[0];
  if (!post) throw new Error("Contribution not found.");
  await db.insert(communityReports).values({ postId, reporterUserId: userId, ...input }).onDuplicateKeyUpdate({ set: { reason: input.reason, detail: input.detail, status: "open" } });
}

export async function getCommunityReports() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(communityReports).where(eq(communityReports.status, "open")).orderBy(desc(communityReports.createdAt)).limit(100);
}

export async function setCommunityPostStatus(postId: number, status: "visible" | "hidden" | "removed") {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(communityPosts).set({ status }).where(eq(communityPosts.id, postId));
}

export type CommunityThreadInput = { tmdbId: number | null; title: string; mediaType: "movie" | "tv" | "unknown"; topic: "plot" | "recommendation" | "discussion" | "craft"; headline: string; body: string; containsSpoilers: boolean; shareAttribution: boolean };

export async function createCommunityThread(userId: number, input: CommunityThreadInput) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(communityThreads).values({ userId, ...input });
}

export async function getCommunityThreads(input: { tmdbId?: number; mediaType?: "movie" | "tv" | "unknown"; topic?: CommunityThreadInput["topic"] }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(communityThreads.status, "visible")];
  if (input.tmdbId) conditions.push(eq(communityThreads.tmdbId, input.tmdbId));
  if (input.mediaType) conditions.push(eq(communityThreads.mediaType, input.mediaType));
  if (input.topic) conditions.push(eq(communityThreads.topic, input.topic));
  const rows = await db.select({ thread: communityThreads, contributorName: users.name }).from(communityThreads).leftJoin(users, eq(communityThreads.userId, users.id)).where(and(...conditions)).orderBy(desc(communityThreads.createdAt)).limit(80);
  return rows.filter(({ thread }) => thread.status === "visible").map(({ thread, contributorName }) => toPublicCommunityItem(thread, contributorName));
}

export async function getThreadReplies(threadId: number) {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select({ reply: communityThreadReplies, contributorName: users.name }).from(communityThreadReplies).leftJoin(users, eq(communityThreadReplies.userId, users.id)).where(and(eq(communityThreadReplies.threadId, threadId), eq(communityThreadReplies.status, "visible"))).orderBy(communityThreadReplies.createdAt).limit(120);
  return rows.filter(({ reply }) => reply.status === "visible").map(({ reply, contributorName }) => toPublicCommunityItem(reply, contributorName));
}

export async function createThreadReply(userId: number, input: { threadId: number; parentReplyId: number | null; body: string; containsSpoilers: boolean; shareAttribution: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  const thread = (await db.select({ id: communityThreads.id }).from(communityThreads).where(and(eq(communityThreads.id, input.threadId), eq(communityThreads.status, "visible"))).limit(1))[0];
  if (!thread) throw new Error("Discussion thread not found.");
  await db.insert(communityThreadReplies).values({ userId, ...input });
}

export async function reportCommunityThread(userId: number, input: { threadId: number; replyId: number | null; reason: "spoiler" | "misleading" | "spam" | "abuse" | "privacy" | "other"; detail: string | null }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(communityThreadReports).values({ reporterUserId: userId, ...input }).onDuplicateKeyUpdate({ set: { reason: input.reason, detail: input.detail, status: "open" } });
}

export async function setCommunityThreadStatus(threadId: number, status: "visible" | "hidden" | "removed") {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(communityThreads).set({ status }).where(eq(communityThreads.id, threadId));
}

export async function setCommunityThreadReplyStatus(replyId: number, status: "visible" | "hidden" | "removed") {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.update(communityThreadReplies).set({ status }).where(eq(communityThreadReplies.id, replyId));
}

export async function getCommunityThreadReports() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(communityThreadReports).where(eq(communityThreadReports.status, "open")).orderBy(desc(communityThreadReports.createdAt)).limit(100);
}

export async function setCommunityTitleRating(userId: number, input: { tmdbId: number; mediaType: "movie" | "tv"; rating: number }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable.");
  await db.insert(communityTitleRatings).values({ userId, ...input }).onDuplicateKeyUpdate({ set: { rating: input.rating } });
}

export function summarizeCommunityRatings(values: number[]) {
  if (!values.length) return { count: 0, average: null as number | null };
  return { count: values.length, average: Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10 };
}

export async function getCommunityTitleRatingSummary(input: { tmdbId: number; mediaType: "movie" | "tv" }) {
  const db = await getDb(); if (!db) return { count: 0, average: null as number | null };
  const rows = await db.select({ rating: communityTitleRatings.rating }).from(communityTitleRatings).where(and(eq(communityTitleRatings.tmdbId, input.tmdbId), eq(communityTitleRatings.mediaType, input.mediaType)));
  return summarizeCommunityRatings(rows.map(row => row.rating));
}

export async function getCommunityTitleReviews(input: { tmdbId: number; mediaType: "movie" | "tv" }) {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select({ post: communityPosts, contributorName: users.name }).from(communityPosts).leftJoin(users, eq(communityPosts.userId, users.id)).where(and(eq(communityPosts.tmdbId, input.tmdbId), eq(communityPosts.mediaType, input.mediaType), eq(communityPosts.kind, "review"), eq(communityPosts.status, "visible"))).orderBy(desc(communityPosts.createdAt)).limit(60);
  return rows.filter(({ post }) => post.status === "visible").map(({ post, contributorName }) => toPublicCommunityItem(post, contributorName));
}
