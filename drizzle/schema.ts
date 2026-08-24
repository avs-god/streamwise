import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const watchlistItems = mysqlTable(
  "watchlistItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tmdbId: int("tmdbId").notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv"]).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    posterPath: varchar("posterPath", { length: 500 }),
    releaseDate: varchar("releaseDate", { length: 16 }),
    plannedFor: mysqlEnum("plannedFor", ["this_week", "this_month", "someday"]).default("someday").notNull(),
    note: text("note"),
    providerNamesJson: text("providerNamesJson").notNull(),
    availabilityCheckedAt: timestamp("availabilityCheckedAt"),
    availabilitySourceUrl: varchar("availabilitySourceUrl", { length: 1024 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("watchlist_user_title_unique").on(table.userId, table.tmdbId, table.mediaType)],
);

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  providerName: varchar("providerName", { length: 150 }).notNull(),
  planName: varchar("planName", { length: 150 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "quarterly", "yearly"]).notNull(),
  renewalDate: timestamp("renewalDate"),
  viewingIntent: mysqlEnum("viewingIntent", ["watch_now", "considering", "keep"]).default("considering").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
