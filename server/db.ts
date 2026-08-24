import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, subscriptions, users, watchlistItems } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getWatchlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
}

export async function addWatchlistItem(
  userId: number,
  item: {
    tmdbId: number;
    mediaType: "movie" | "tv";
    title: string;
    posterPath?: string | null;
    releaseDate?: string | null;
    plannedFor: "this_week" | "this_month" | "someday";
    note?: string | null;
    providerNamesJson: string;
    availabilityCheckedAt?: Date | null;
    availabilitySourceUrl?: string | null;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(watchlistItems).values({ userId, ...item }).onDuplicateKeyUpdate({
    set: {
      title: item.title,
      posterPath: item.posterPath ?? null,
      releaseDate: item.releaseDate ?? null,
      plannedFor: item.plannedFor,
      note: item.note ?? null,
      providerNamesJson: item.providerNamesJson,
      availabilityCheckedAt: item.availabilityCheckedAt ?? null,
      availabilitySourceUrl: item.availabilitySourceUrl ?? null,
    },
  });
}

export async function updateWatchlistIntent(userId: number, id: number, plannedFor: "this_week" | "this_month" | "someday") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(watchlistItems).set({ plannedFor }).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function updateWatchlistNote(userId: number, id: number, note: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(watchlistItems).set({ note }).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function removeWatchlistItem(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.delete(watchlistItems).where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
}

export async function getSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
}

export type SubscriptionInput = {
  providerName: string;
  planName: string;
  price: string;
  currency: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  renewalDate: Date | null;
  viewingIntent: "watch_now" | "considering" | "keep";
};

export async function addSubscription(userId: number, input: SubscriptionInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(subscriptions).values({ userId, ...input });
}

export async function updateSubscription(userId: number, id: number, input: SubscriptionInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(subscriptions).set(input).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
}

export async function removeSubscription(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
}
