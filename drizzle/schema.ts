import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
    monitorAvailability: boolean("monitorAvailability").default(true).notNull(),
    availabilityRegion: varchar("availabilityRegion", { length: 2 }).default("US").notNull(),
    providerNamesJson: text("providerNamesJson").notNull(),
    availabilityCheckedAt: timestamp("availabilityCheckedAt"),
    availabilitySourceUrl: varchar("availabilitySourceUrl", { length: 1024 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("watchlist_user_title_unique").on(table.userId, table.tmdbId, table.mediaType), index("watchlist_monitor_idx").on(table.monitorAvailability)],
);

export const availabilitySnapshots = mysqlTable(
  "availabilitySnapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    watchlistItemId: int("watchlistItemId").notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    offersJson: text("offersJson").notNull(),
    fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1024 }),
    checkedAt: timestamp("checkedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("availability_snapshot_item_checked_idx").on(table.watchlistItemId, table.checkedAt)],
);

export const alertPreferences = mysqlTable("alertPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  availabilityChangesEnabled: boolean("availabilityChangesEnabled").default(false).notNull(),
  renewalRemindersEnabled: boolean("renewalRemindersEnabled").default(false).notNull(),
  pauseRemindersEnabled: boolean("pauseRemindersEnabled").default(false).notNull(),
  renewalLeadDays: int("renewalLeadDays").default(7).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const alerts = mysqlTable(
  "alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["availability_changed", "renewal_due", "pause_review", "subscription_action"]).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body").notNull(),
    payloadJson: text("payloadJson").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("alerts_user_created_idx").on(table.userId, table.createdAt)],
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
  status: mysqlEnum("status", ["active", "paused", "cancellation_planned", "cancelled"]).default("active").notNull(),
  pauseUntil: timestamp("pauseUntil"),
  cancellationRequestedAt: timestamp("cancellationRequestedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const subscriptionActions = mysqlTable(
  "subscriptionActions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subscriptionId: int("subscriptionId").notNull(),
    actionType: mysqlEnum("actionType", ["paused", "resumed", "cancellation_planned", "cancelled", "renewal_updated"]).notNull(),
    note: text("note"),
    actionAt: timestamp("actionAt").defaultNow().notNull(),
  },
  table => [index("subscription_actions_user_subscription_idx").on(table.userId, table.subscriptionId, table.actionAt)],
);

export const communityPosts = mysqlTable(
  "communityPosts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv", "unknown"]).default("unknown").notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    providerName: varchar("providerName", { length: 150 }),
    kind: mysqlEnum("kind", ["available", "ppv", "leaving_soon", "review", "recommendation"]).notNull(),
    body: text("body").notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1024 }),
    shareAttribution: boolean("shareAttribution").default(false).notNull(),
    status: mysqlEnum("status", ["visible", "hidden", "removed"]).default("visible").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("community_posts_visible_created_idx").on(table.status, table.createdAt), index("community_posts_region_kind_idx").on(table.region, table.kind)],
);

export const communityReports = mysqlTable(
  "communityReports",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    reporterUserId: int("reporterUserId").notNull(),
    reason: mysqlEnum("reason", ["misleading", "spam", "abuse", "privacy", "other"]).notNull(),
    detail: varchar("detail", { length: 500 }),
    status: mysqlEnum("status", ["open", "resolved", "dismissed"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("community_report_reporter_post_unique").on(table.reporterUserId, table.postId), index("community_reports_post_status_idx").on(table.postId, table.status)],
);

export const communityThreads = mysqlTable(
  "communityThreads",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tmdbId: int("tmdbId"),
    title: varchar("title", { length: 500 }).notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv", "unknown"]).default("unknown").notNull(),
    topic: mysqlEnum("topic", ["plot", "recommendation", "discussion", "craft"]).notNull(),
    headline: varchar("headline", { length: 240 }).notNull(),
    body: text("body").notNull(),
    containsSpoilers: boolean("containsSpoilers").default(false).notNull(),
    shareAttribution: boolean("shareAttribution").default(false).notNull(),
    status: mysqlEnum("status", ["visible", "hidden", "removed"]).default("visible").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("community_threads_visible_created_idx").on(table.status, table.createdAt), index("community_threads_title_idx").on(table.tmdbId, table.mediaType)],
);

export const communityThreadReplies = mysqlTable(
  "communityThreadReplies",
  {
    id: int("id").autoincrement().primaryKey(),
    threadId: int("threadId").notNull(),
    userId: int("userId").notNull(),
    parentReplyId: int("parentReplyId"),
    body: text("body").notNull(),
    containsSpoilers: boolean("containsSpoilers").default(false).notNull(),
    shareAttribution: boolean("shareAttribution").default(false).notNull(),
    status: mysqlEnum("status", ["visible", "hidden", "removed"]).default("visible").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("community_thread_replies_thread_created_idx").on(table.threadId, table.createdAt)],
);

export const communityThreadReports = mysqlTable(
  "communityThreadReports",
  {
    id: int("id").autoincrement().primaryKey(),
    threadId: int("threadId").notNull(),
    replyId: int("replyId"),
    reporterUserId: int("reporterUserId").notNull(),
    reason: mysqlEnum("reason", ["spoiler", "misleading", "spam", "abuse", "privacy", "other"]).notNull(),
    detail: varchar("detail", { length: 500 }),
    status: mysqlEnum("status", ["open", "resolved", "dismissed"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("thread_report_reporter_target_unique").on(table.reporterUserId, table.threadId, table.replyId)],
);

export const scheduledJobs = mysqlTable("scheduledJobs", {
  id: int("id").autoincrement().primaryKey(),
  jobKey: varchar("jobKey", { length: 80 }).notNull().unique(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
