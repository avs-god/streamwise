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

/** A member actively records this signal; Streamwise never infers it from viewing, finance, or community activity. */
export const viewingSignals = mysqlTable(
  "viewingSignals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tmdbId: int("tmdbId").notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv"]).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    status: mysqlEnum("status", ["watched"]).default("watched").notNull(),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("viewing_signal_member_title_unique").on(table.userId, table.tmdbId, table.mediaType), index("viewing_signal_member_recorded_idx").on(table.userId, table.recordedAt)],
);

/** Optional preferences a member intentionally saves for recommendation filtering; never inferred from activity. */
export const tasteProfiles = mysqlTable("tasteProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  favoriteGenresJson: text("favoriteGenresJson").notNull(),
  preferredLanguagesJson: text("preferredLanguagesJson").notNull(),
  maxRuntimeMinutes: int("maxRuntimeMinutes"),
  includeMovies: boolean("includeMovies").default(true).notNull(),
  includeSeries: boolean("includeSeries").default(true).notNull(),
  defaultRegion: varchar("defaultRegion", { length: 2 }).default("IN").notNull(),
  interfaceDensity: mysqlEnum("interfaceDensity", ["comfortable", "compact"]).default("comfortable").notNull(),
  reducedMotion: boolean("reducedMotion").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  emailRecommendationEnabled: boolean("emailRecommendationEnabled").default(false).notNull(),
  emailLeavingSoonEnabled: boolean("emailLeavingSoonEnabled").default(false).notNull(),
  emailCommunityEnabled: boolean("emailCommunityEnabled").default(false).notNull(),
  pushEnabled: boolean("pushEnabled").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Member-selected provider names used only to narrow alerts from their own saved-title catalog snapshots. */
export const providerAlertSubscriptions = mysqlTable(
  "providerAlertSubscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    providerName: varchar("providerName", { length: 150 }).notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("provider_alert_subscription_member_provider_region_unique").on(table.userId, table.providerName, table.region), index("provider_alert_subscription_member_region_idx").on(table.userId, table.region)],
);

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
    tmdbId: int("tmdbId"),
    title: varchar("title", { length: 500 }).notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv", "unknown"]).default("unknown").notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    providerName: varchar("providerName", { length: 150 }),
    reportedLeavingAt: timestamp("reportedLeavingAt"),
    switchesToProviderName: varchar("switchesToProviderName", { length: 150 }),
    kind: mysqlEnum("kind", ["available", "ppv", "leaving_soon", "review", "recommendation"]).notNull(),
    body: text("body").notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1024 }),
    shareAttribution: boolean("shareAttribution").default(false).notNull(),
    status: mysqlEnum("status", ["pending", "visible", "hidden", "removed"]).default("visible").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("community_posts_visible_created_idx").on(table.status, table.createdAt), index("community_posts_region_kind_idx").on(table.region, table.kind)],
);

export const communityTitleRatings = mysqlTable(
  "communityTitleRatings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tmdbId: int("tmdbId").notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv"]).notNull(),
    rating: int("rating").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("community_title_rating_member_unique").on(table.userId, table.tmdbId, table.mediaType), index("community_title_rating_title_idx").on(table.tmdbId, table.mediaType)],
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

/** An observed removal from two legal provider snapshots. It is not an announced departure date or a community/web claim. */
export const confirmedProviderDepartures = mysqlTable(
  "confirmedProviderDepartures",
  {
    id: int("id").autoincrement().primaryKey(),
    tmdbId: int("tmdbId").notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv"]).notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    providerName: varchar("providerName", { length: 150 }).notNull(),
    providerType: varchar("providerType", { length: 24 }).notNull(),
    sourceKind: mysqlEnum("sourceKind", ["change_feed", "snapshot"]).default("snapshot").notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1024 }),
    firstObservedAt: timestamp("firstObservedAt").notNull(),
    lastObservedAt: timestamp("lastObservedAt").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    status: mysqlEnum("status", ["active", "resolved"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("confirmed_departure_title_provider_region_unique").on(table.tmdbId, table.mediaType, table.region, table.providerName), index("confirmed_departure_active_lookup_idx").on(table.tmdbId, table.mediaType, table.region, table.status, table.expiresAt)],
);

/** Bounded public-web context for an explicitly monitored title. Never used as legal-offer, departure, or alert evidence. */
export const publicLeavingSoonResearch = mysqlTable(
  "publicLeavingSoonResearch",
  {
    id: int("id").autoincrement().primaryKey(),
    tmdbId: int("tmdbId").notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv"]).notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    directResponse: text("directResponse").notNull(),
    sourcesJson: text("sourcesJson").notNull(),
    communitySourcesJson: text("communitySourcesJson").notNull(),
    status: mysqlEnum("status", ["lead", "insufficient", "unavailable"]).notNull(),
    searchedAt: timestamp("searchedAt").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("public_leaving_soon_title_region_unique").on(table.tmdbId, table.mediaType, table.region), index("public_leaving_soon_active_lookup_idx").on(table.tmdbId, table.mediaType, table.region, table.expiresAt)],
);

/** Exact future streaming dates supplied by a provider change feed. This is an announcement signal, never a current offer. */
export const announcedStreamingReleases = mysqlTable(
  "announcedStreamingReleases",
  {
    id: int("id").autoincrement().primaryKey(),
    tmdbId: int("tmdbId").notNull(),
    mediaType: mysqlEnum("mediaType", ["movie", "tv"]).notNull(),
    region: varchar("region", { length: 2 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    providerName: varchar("providerName", { length: 150 }).notNull(),
    providerType: varchar("providerType", { length: 24 }).notNull(),
    sourceKind: mysqlEnum("sourceKind", ["provider_change_feed"]).default("provider_change_feed").notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1024 }),
    announcedFor: timestamp("announcedFor").notNull(),
    retrievedAt: timestamp("retrievedAt").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    status: mysqlEnum("status", ["active", "resolved"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("announced_streaming_title_provider_region_unique").on(table.tmdbId, table.mediaType, table.region, table.providerName), index("announced_streaming_active_lookup_idx").on(table.tmdbId, table.mediaType, table.region, table.status, table.announcedFor)],
);

export const browserPushSubscriptions = mysqlTable(
  "browserPushSubscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    endpoint: varchar("endpoint", { length: 2048 }).notNull(),
    p256dh: varchar("p256dh", { length: 512 }).notNull(),
    auth: varchar("auth", { length: 512 }).notNull(),
    userAgent: varchar("userAgent", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("browser_push_endpoint_unique").on(table.endpoint), index("browser_push_user_idx").on(table.userId)],
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
