import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.hoisted(() => ({
  getWatchlist: vi.fn(async (userId: number) => [{ id: 11, userId, title: `Private list for ${userId}` }]),
  getSubscriptions: vi.fn(async (userId: number) => [{ id: 22, userId, providerName: `Provider ${userId}` }]),
  updateWatchlistNote: vi.fn(async () => undefined),
}));

vi.mock("./db", () => ({
  addSubscription: vi.fn(),
  addWatchlistItem: vi.fn(),
  getSubscriptions: mockedDb.getSubscriptions,
  getWatchlist: mockedDb.getWatchlist,
  removeSubscription: vi.fn(),
  removeWatchlistItem: vi.fn(),
  updateSubscription: vi.fn(),
  updateWatchlistIntent: vi.fn(),
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
});
