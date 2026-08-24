import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.hoisted(() => ({
  getWatchlist: vi.fn(async (userId: number) => [{ id: 11, userId, title: `Private list for ${userId}` }]),
  getSubscriptions: vi.fn(async (userId: number) => [{ id: 22, userId, providerName: `Provider ${userId}` }]),
  updateWatchlistNote: vi.fn(async () => undefined),
  updateAlertPreferences: vi.fn(async (userId: number, input: unknown) => ({ userId, ...input })),
  getAlertPreferences: vi.fn(async () => ({ availabilityChangesEnabled: false, renewalRemindersEnabled: false, pauseRemindersEnabled: false, renewalLeadDays: 7, inAppEnabled: false })),
  applySubscriptionAction: vi.fn(async () => undefined),
  createAlert: vi.fn(async () => undefined),
  createCommunityPost: vi.fn(async () => undefined),
  createCommunityThread: vi.fn(async () => undefined),
  createThreadReply: vi.fn(async () => undefined),
  getCommunityThreads: vi.fn(async () => []),
  getThreadReplies: vi.fn(async () => []),
  reportCommunityPost: vi.fn(async () => undefined),
  reportCommunityThread: vi.fn(async () => undefined),
  setCommunityTitleRating: vi.fn(async () => undefined),
  getCommunityPosts: vi.fn(async () => []),
  getCommunityReports: vi.fn(async () => []),
  getCommunityThreadReports: vi.fn(async () => []),
  getViewingSignals: vi.fn(async (userId: number) => [{ id: 88, userId, title: `Recorded title for ${userId}` }]),
  recordViewingSignal: vi.fn(async () => undefined),
  removeViewingSignal: vi.fn(async () => undefined),
  setCommunityPostStatus: vi.fn(async () => undefined),
  setCommunityThreadStatus: vi.fn(async () => undefined),
  setCommunityThreadReplyStatus: vi.fn(async () => undefined),
}));

vi.mock("./db", () => ({
  addSubscription: vi.fn(),
  addAvailabilitySnapshot: vi.fn(),
  addWatchlistItem: vi.fn(),
  applySubscriptionAction: mockedDb.applySubscriptionAction,
  createAlert: mockedDb.createAlert,
  createCommunityPost: mockedDb.createCommunityPost,
  createCommunityThread: mockedDb.createCommunityThread,
  createThreadReply: mockedDb.createThreadReply,
  getAlertPreferences: mockedDb.getAlertPreferences,
  getAlerts: vi.fn(async () => []),
  getCommunityPosts: mockedDb.getCommunityPosts,
  getCommunityThreads: mockedDb.getCommunityThreads,
  getThreadReplies: mockedDb.getThreadReplies,
  getCommunityReports: mockedDb.getCommunityReports,
  getCommunityThreadReports: mockedDb.getCommunityThreadReports,
  getViewingSignals: mockedDb.getViewingSignals,
  getSnapshotHistory: vi.fn(async () => []),
  getSubscriptionActions: vi.fn(async () => []),
  getSubscriptions: mockedDb.getSubscriptions,
  getWatchlist: mockedDb.getWatchlist,
  markAlertRead: vi.fn(),
  markAllAlertsRead: vi.fn(),
  removeSubscription: vi.fn(),
  removeViewingSignal: mockedDb.removeViewingSignal,
  removeWatchlistItem: vi.fn(),
  recordViewingSignal: mockedDb.recordViewingSignal,
  reportCommunityPost: mockedDb.reportCommunityPost,
  reportCommunityThread: mockedDb.reportCommunityThread,
  setCommunityTitleRating: mockedDb.setCommunityTitleRating,
  setCommunityPostStatus: mockedDb.setCommunityPostStatus,
  setCommunityThreadStatus: mockedDb.setCommunityThreadStatus,
  setCommunityThreadReplyStatus: mockedDb.setCommunityThreadReplyStatus,
  updateAlertPreferences: mockedDb.updateAlertPreferences,
  updateSubscription: vi.fn(),
  updateWatchlistIntent: vi.fn(),
  updateWatchlistMonitoring: vi.fn(),
  updateWatchlistNote: mockedDb.updateWatchlistNote,
}));

import { appRouter } from "./routers";

function contextFor(userId: number, role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: `User ${userId}`,
      email: `user-${userId}@example.com`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("private profile data access", () => {
  it("scopes watchlist and subscription reads to the authenticated user", async () => {
    const firstCaller = appRouter.createCaller(contextFor(7));
    const secondCaller = appRouter.createCaller(contextFor(19));

    const [firstWatchlist, secondWallet] = await Promise.all([
      firstCaller.watchlist.list(),
      secondCaller.subscriptions.list(),
    ]);

    expect(mockedDb.getWatchlist).toHaveBeenCalledWith(7);
    expect(mockedDb.getSubscriptions).toHaveBeenCalledWith(19);
    expect(firstWatchlist[0]).toMatchObject({ userId: 7 });
    expect(secondWallet[0]).toMatchObject({ userId: 19 });
  });

  it("sends a trimmed private note together with the authenticated user id", async () => {
    const caller = appRouter.createCaller(contextFor(7));

    await caller.watchlist.setNote({ id: 11, note: "  watch with family  " });

    expect(mockedDb.updateWatchlistNote).toHaveBeenCalledWith(7, 11, "watch with family");
  });

  it("scopes alert preferences and lifecycle actions to the authenticated user", async () => {
    const caller = appRouter.createCaller(contextFor(19));
    const preferences = { availabilityChangesEnabled: true, renewalRemindersEnabled: true, pauseRemindersEnabled: true, renewalLeadDays: 14, inAppEnabled: false };

    await caller.alerts.updatePreferences(preferences);
    await caller.subscriptions.action({ id: 22, actionType: "paused" });

    expect(mockedDb.updateAlertPreferences).toHaveBeenCalledWith(19, preferences);
    expect(mockedDb.applySubscriptionAction).toHaveBeenCalledWith(19, 22, "paused", null, null);
    expect(mockedDb.createAlert).not.toHaveBeenCalled();
  });

  it("writes community contributions and moderation reports under the authenticated user", async () => {
    const caller = appRouter.createCaller(contextFor(7));
    const post = { title: "Example Film", mediaType: "movie" as const, region: "IN", providerName: "Example Provider", kind: "available" as const, body: "A structured contribution with enough context.", sourceUrl: "https://example.com/source", shareAttribution: false };

    await caller.community.contribute(post);
    await caller.community.report({ postId: 12, reason: "misleading", detail: "Needs a source check." });

    expect(mockedDb.createCommunityPost).toHaveBeenCalledWith(7, { ...post, tmdbId: null });
    expect(mockedDb.reportCommunityPost).toHaveBeenCalledWith(7, 12, { reason: "misleading", detail: "Needs a source check." });
  });

  it("writes thread creation, replies, and reports under the authenticated member", async () => {
    const caller = appRouter.createCaller(contextFor(19));
    const thread = { tmdbId: null, title: "Example Film", mediaType: "movie" as const, topic: "plot" as const, headline: "A careful plot discussion", body: "This is a spoiler-conscious discussion with enough useful context.", containsSpoilers: true, shareAttribution: false };
    await caller.community.createThread(thread);
    await caller.community.reply({ threadId: 5, parentReplyId: null, body: "A thoughtful reply.", containsSpoilers: false, shareAttribution: false });
    await caller.community.reply({ threadId: 5, parentReplyId: 2, body: "A nested thoughtful reply.", containsSpoilers: false, shareAttribution: false });
    await caller.community.reportThread({ threadId: 5, replyId: null, reason: "spoiler", detail: "Please add a clearer spoiler label." });
    await caller.community.reportThread({ threadId: 5, replyId: 2, reason: "abuse", detail: "Reply requires moderator review." });

    expect(mockedDb.createCommunityThread).toHaveBeenCalledWith(19, thread);
    expect(mockedDb.createThreadReply).toHaveBeenCalledWith(19, { threadId: 5, parentReplyId: null, body: "A thoughtful reply.", containsSpoilers: false, shareAttribution: false });
    expect(mockedDb.createThreadReply).toHaveBeenCalledWith(19, { threadId: 5, parentReplyId: 2, body: "A nested thoughtful reply.", containsSpoilers: false, shareAttribution: false });
    expect(mockedDb.reportCommunityThread).toHaveBeenCalledWith(19, { threadId: 5, replyId: null, reason: "spoiler", detail: "Please add a clearer spoiler label." });
    expect(mockedDb.reportCommunityThread).toHaveBeenCalledWith(19, { threadId: 5, replyId: 2, reason: "abuse", detail: "Reply requires moderator review." });
  });

  it("scopes title ratings to the authenticated member and rejects out-of-range values", async () => {
    const caller = appRouter.createCaller(contextFor(7));
    await caller.community.setTitleRating({ tmdbId: 27205, mediaType: "movie", rating: 4 });
    expect(mockedDb.setCommunityTitleRating).toHaveBeenCalledWith(7, { tmdbId: 27205, mediaType: "movie", rating: 4 });
    await expect(caller.community.setTitleRating({ tmdbId: 27205, mediaType: "movie", rating: 6 })).rejects.toThrow();
  });

  it("rejects malformed community contributions, thread replies, and reports before persistence", async () => {
    const caller = appRouter.createCaller(contextFor(7));
    await expect(caller.community.contribute({ title: "Film", mediaType: "movie", region: "IND", providerName: null, kind: "available", body: "Too short", sourceUrl: null, shareAttribution: false })).rejects.toThrow();
    await expect(caller.community.contribute({ title: "Film", mediaType: "movie", region: "IN", providerName: null, kind: "review", body: "", sourceUrl: null, shareAttribution: false })).rejects.toThrow();
    await expect(caller.community.createThread({ tmdbId: null, title: "Film", mediaType: "movie", topic: "plot", headline: "Tiny", body: "Too short", containsSpoilers: false, shareAttribution: false })).rejects.toThrow();
    await expect(caller.community.reply({ threadId: 0, parentReplyId: null, body: "x", containsSpoilers: false, shareAttribution: false })).rejects.toThrow();
    await expect(caller.community.reportThread({ threadId: 5, replyId: null, reason: "not-a-reason" as never, detail: null })).rejects.toThrow();
    expect(mockedDb.createCommunityPost).toHaveBeenCalledTimes(1);
    expect(mockedDb.createCommunityThread).toHaveBeenCalledTimes(1);
    expect(mockedDb.createThreadReply).toHaveBeenCalledTimes(2);
    expect(mockedDb.reportCommunityThread).toHaveBeenCalledTimes(2);
  });

  it("rejects each malformed report endpoint before any report persistence call", async () => {
    vi.clearAllMocks();
    const caller = appRouter.createCaller(contextFor(7));
    await expect(caller.community.report({ postId: 0, reason: "spam", detail: null })).rejects.toThrow();
    expect(mockedDb.reportCommunityPost).not.toHaveBeenCalled();
    await expect(caller.community.reportThread({ threadId: 5, replyId: 0, reason: "spam", detail: null })).rejects.toThrow();
    expect(mockedDb.reportCommunityThread).not.toHaveBeenCalled();
  });

  it("limits moderation reads and status changes to administrators", async () => {
    const member = appRouter.createCaller(contextFor(7));
    const admin = appRouter.createCaller(contextFor(1, "admin"));
    await expect(member.community.moderation.reports()).rejects.toThrow();
    await admin.community.moderation.reports();
    await admin.community.moderation.threadReports();
    await admin.community.moderation.setStatus({ postId: 12, status: "hidden" });
    await admin.community.moderation.setThreadStatus({ threadId: 5, status: "removed" });
    await admin.community.moderation.setReplyStatus({ replyId: 8, status: "hidden" });
    expect(mockedDb.getCommunityReports).toHaveBeenCalledTimes(1);
    expect(mockedDb.getCommunityThreadReports).toHaveBeenCalledTimes(1);
    expect(mockedDb.setCommunityPostStatus).toHaveBeenCalledWith(12, "hidden");
    expect(mockedDb.setCommunityThreadStatus).toHaveBeenCalledWith(5, "removed");
    expect(mockedDb.setCommunityThreadReplyStatus).toHaveBeenCalledWith(8, "hidden");
  });

  it("keeps catalog and subscription decisions independent of community data", async () => {
    vi.clearAllMocks();
    mockedDb.getCommunityPosts.mockResolvedValue([{ id: 99, userId: 7, title: "Community-only lead", body: "Unverified discussion must not change private decisions." }]);
    mockedDb.getSubscriptions.mockResolvedValue([{ id: 22, userId: 7, providerName: "Provider 7", planName: "Plan", price: "10.00", currency: "USD", billingCycle: "monthly", renewalDate: null, viewingIntent: "considering", status: "active" }]);
    mockedDb.getWatchlist.mockResolvedValue([]);
    const caller = appRouter.createCaller(contextFor(7));
    const [catalogStatus, decisions] = await Promise.all([caller.catalog.status(), caller.decisions.get()]);
    expect(catalogStatus).toEqual({ configured: expect.any(Boolean), provider: "TMDb / JustWatch" });
    expect(decisions[0]).not.toHaveProperty("community");
    expect(JSON.stringify(decisions)).not.toContain("Community-only lead");
    expect(mockedDb.getCommunityPosts).not.toHaveBeenCalled();
  });

  it("scopes explicit viewing-signal reads, records, and removal to the signed-in member", async () => {
    vi.clearAllMocks();
    const caller = appRouter.createCaller(contextFor(19));
    const signals = await caller.viewingSignals.list();
    await caller.viewingSignals.record({ tmdbId: 27205, mediaType: "movie", title: "Inception" });
    await caller.viewingSignals.remove({ id: 88 });
    const picks = await caller.viewingSignals.postWatchPicks({ language: "en-US" });
    expect(signals[0]).toMatchObject({ userId: 19 });
    expect(mockedDb.getViewingSignals).toHaveBeenCalledWith(19);
    expect(mockedDb.recordViewingSignal).toHaveBeenCalledWith(19, { tmdbId: 27205, mediaType: "movie", title: "Inception" });
    expect(mockedDb.removeViewingSignal).toHaveBeenCalledWith(19, 88);
    expect(picks).toMatchObject({ configured: false, titles: [], recordedCount: 1 });
    expect(picks.explanation).toContain("will not invent post-watch picks");
  });
});
