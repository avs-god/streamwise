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
  reportCommunityPost: vi.fn(async () => undefined),
  getCommunityPosts: vi.fn(async () => []),
}));

vi.mock("./db", () => ({
  addSubscription: vi.fn(),
  addAvailabilitySnapshot: vi.fn(),
  addWatchlistItem: vi.fn(),
  applySubscriptionAction: mockedDb.applySubscriptionAction,
  createAlert: mockedDb.createAlert,
  createCommunityPost: mockedDb.createCommunityPost,
  getAlertPreferences: mockedDb.getAlertPreferences,
  getAlerts: vi.fn(async () => []),
  getCommunityPosts: mockedDb.getCommunityPosts,
  getCommunityReports: vi.fn(async () => []),
  getSnapshotHistory: vi.fn(async () => []),
  getSubscriptionActions: vi.fn(async () => []),
  getSubscriptions: mockedDb.getSubscriptions,
  getWatchlist: mockedDb.getWatchlist,
  markAlertRead: vi.fn(),
  markAllAlertsRead: vi.fn(),
  removeSubscription: vi.fn(),
  removeWatchlistItem: vi.fn(),
  reportCommunityPost: mockedDb.reportCommunityPost,
  setCommunityPostStatus: vi.fn(),
  updateAlertPreferences: mockedDb.updateAlertPreferences,
  updateSubscription: vi.fn(),
  updateWatchlistIntent: vi.fn(),
  updateWatchlistMonitoring: vi.fn(),
  updateWatchlistNote: mockedDb.updateWatchlistNote,
}));

import { appRouter } from "./routers";

function contextFor(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: `User ${userId}`,
      email: `user-${userId}@example.com`,
      loginMethod: "manus",
      role: "user",
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
    const post = { title: "Example Film", mediaType: "movie" as const, region: "IN", providerName: "Example Provider", kind: "review" as const, body: "A careful member review with enough context.", sourceUrl: "https://example.com/source", shareAttribution: false };

    await caller.community.contribute(post);
    await caller.community.report({ postId: 12, reason: "misleading", detail: "Needs a source check." });

    expect(mockedDb.createCommunityPost).toHaveBeenCalledWith(7, post);
    expect(mockedDb.reportCommunityPost).toHaveBeenCalledWith(7, 12, { reason: "misleading", detail: "Needs a source check." });
  });
});
