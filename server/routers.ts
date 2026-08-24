import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { providerGuides } from "../shared/providers";
import { offersFingerprint, normalizeOffers } from "./availabilityTracking";
import {
  addAvailabilitySnapshot,
  addSubscription,
  addWatchlistItem,
  applySubscriptionAction,
  createCommunityPost,
  createCommunityThread,
  createThreadReply,
  createAlert,
  getAlertPreferences,
  getAlerts,
  getCommunityPosts,
  getCommunityThreadReports,
  getCommunityTitleRatingSummary,
  getCommunityTitleReviews,
  getCommunityThreads,
  getThreadReplies,
  getCommunityReports,
  getSnapshotHistory,
  getSubscriptionActions,
  getSubscriptions,
  getWatchlist,
  markAlertRead,
  markAllAlertsRead,
  reportCommunityPost,
  reportCommunityThread,
  removeSubscription,
  removeWatchlistItem,
  updateAlertPreferences,
  updateSubscription,
  updateWatchlistIntent,
  updateWatchlistMonitoring,
  updateWatchlistNote,
  setCommunityPostStatus,
  setCommunityTitleRating,
  setCommunityThreadStatus,
} from "./db";
import { discoverCatalog, getCatalogDetail, getSimilarCatalogTitles, isCatalogConfigured, searchCatalog } from "./catalog";
import { refreshTrackedTitle, refreshTrackedTitlesForUser } from "./trackingService";
import { syncRenewalAlerts } from "./alertService";
import { researchDiscoveryLead } from "./aiDiscovery";
import { askPersonalAssistant } from "./personalAssistant";
import { buildSubscriptionDecisions } from "./recommendations";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const plannedFor = z.enum(["this_week", "this_month", "someday"]);
const billingCycle = z.enum(["monthly", "quarterly", "yearly"]);
const viewingIntent = z.enum(["watch_now", "considering", "keep"]);
const lifecycleAction = z.enum(["paused", "resumed", "cancellation_planned", "cancelled"]);
const subscriptionInput = z.object({
  providerName: z.string().trim().min(1).max(150), planName: z.string().trim().min(1).max(150),
  price: z.number().finite().nonnegative().max(1_000_000), currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  billingCycle, renewalDate: z.coerce.date().nullable(), viewingIntent,
});
const snapshotOffer = z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(150), type: z.enum(["stream", "ads", "free", "rent", "buy"]) });
const communityKind = z.enum(["available", "ppv", "leaving_soon", "review", "recommendation"]);
const communityPostInput = z.object({
  tmdbId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1).max(500), mediaType: z.enum(["movie", "tv", "unknown"]), region: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  providerName: z.string().trim().min(1).max(150).nullable().optional(), kind: communityKind, body: z.string().trim().min(20).max(2000),
  sourceUrl: z.string().url().max(1024).nullable().optional(), shareAttribution: z.boolean(),
});
const threadTopic = z.enum(["plot", "recommendation", "discussion", "craft"]);
const threadInput = z.object({ tmdbId: z.number().int().positive().nullable().optional(), title: z.string().trim().min(1).max(500), mediaType: z.enum(["movie", "tv", "unknown"]), topic: threadTopic, headline: z.string().trim().min(5).max(240), body: z.string().trim().min(20).max(5000), containsSpoilers: z.boolean(), shareAttribution: z.boolean() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    status: publicProcedure.query(() => ({ configured: isCatalogConfigured(), provider: "TMDb / JustWatch" })),
    search: publicProcedure.input(z.object({ query: z.string().trim().min(2).max(120), language: z.string().default("en-US") })).query(({ input }) => searchCatalog(input)),
    title: publicProcedure.input(z.object({ id: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), region: z.string(), language: z.string().default("en-US") })).query(({ input }) => getCatalogDetail(input)),
    discover: publicProcedure.input(z.object({ mode: z.enum(["popular", "top_rated", "genre"]), mediaType: z.enum(["movie", "tv", "all"]).default("all"), region: z.string().regex(/^[A-Z]{2}$/), language: z.string().default("en-US"), genreId: z.number().int().positive().optional() })).query(({ input }) => discoverCatalog(input)),
    similar: publicProcedure.input(z.object({ id: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), language: z.string().default("en-US") })).query(({ input }) => getSimilarCatalogTitles(input)),
  }),
  ai: router({
    research: protectedProcedure.input(z.object({ query: z.string().trim().min(3).max(220), region: z.string().regex(/^[A-Z]{2}$/), language: z.string().min(2).max(20) })).mutation(({ input }) => researchDiscoveryLead(input)),
  }),
  assistant: router({
    ask: protectedProcedure.input(z.object({ question: z.string().trim().min(2).max(750) })).mutation(({ ctx, input }) => askPersonalAssistant(ctx.user.id, input.question)),
  }),
  providers: router({ list: publicProcedure.query(() => providerGuides) }),
  community: router({
    list: publicProcedure.input(z.object({ region: z.string().regex(/^[A-Z]{2}$/).optional(), kind: communityKind.optional() }).optional()).query(({ input }) => getCommunityPosts(input ?? {})),
    contribute: protectedProcedure.input(communityPostInput).mutation(async ({ ctx, input }) => { await createCommunityPost(ctx.user.id, { ...input, tmdbId: input.tmdbId ?? null, providerName: input.providerName ?? null, sourceUrl: input.sourceUrl ?? null }); return { success: true }; }),
    report: protectedProcedure.input(z.object({ postId: z.number().int().positive(), reason: z.enum(["misleading", "spam", "abuse", "privacy", "other"]), detail: z.string().trim().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => { await reportCommunityPost(ctx.user.id, input.postId, { reason: input.reason, detail: input.detail ?? null }); return { success: true }; }),
    titleRatingSummary: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]) })).query(({ input }) => getCommunityTitleRatingSummary(input)),
    titleReviews: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]) })).query(({ input }) => getCommunityTitleReviews(input)),
    setTitleRating: protectedProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), rating: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => { await setCommunityTitleRating(ctx.user.id, input); return { success: true }; }),
    threads: publicProcedure.input(z.object({ tmdbId: z.number().int().positive().optional(), mediaType: z.enum(["movie", "tv", "unknown"]).optional(), topic: threadTopic.optional() }).optional()).query(({ input }) => getCommunityThreads(input ?? {})),
    createThread: protectedProcedure.input(threadInput).mutation(async ({ ctx, input }) => { await createCommunityThread(ctx.user.id, { ...input, tmdbId: input.tmdbId ?? null }); return { success: true }; }),
    replies: publicProcedure.input(z.object({ threadId: z.number().int().positive() })).query(({ input }) => getThreadReplies(input.threadId)),
    reply: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), parentReplyId: z.number().int().positive().nullable().optional(), body: z.string().trim().min(2).max(4000), containsSpoilers: z.boolean(), shareAttribution: z.boolean() })).mutation(async ({ ctx, input }) => { await createThreadReply(ctx.user.id, { ...input, parentReplyId: input.parentReplyId ?? null }); return { success: true }; }),
    reportThread: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), replyId: z.number().int().positive().nullable().optional(), reason: z.enum(["spoiler", "misleading", "spam", "abuse", "privacy", "other"]), detail: z.string().trim().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => { await reportCommunityThread(ctx.user.id, { ...input, replyId: input.replyId ?? null, detail: input.detail ?? null }); return { success: true }; }),
    moderation: router({
      reports: adminProcedure.query(() => getCommunityReports()),
      threadReports: adminProcedure.query(() => getCommunityThreadReports()),
      setStatus: adminProcedure.input(z.object({ postId: z.number().int().positive(), status: z.enum(["visible", "hidden", "removed"]) })).mutation(async ({ input }) => { await setCommunityPostStatus(input.postId, input.status); return { success: true }; }),
      setThreadStatus: adminProcedure.input(z.object({ threadId: z.number().int().positive(), status: z.enum(["visible", "hidden", "removed"]) })).mutation(async ({ input }) => { await setCommunityThreadStatus(input.threadId, input.status); return { success: true }; }),
    }),
  }),
  watchlist: router({
    list: protectedProcedure.query(({ ctx }) => getWatchlist(ctx.user.id)),
    add: protectedProcedure.input(z.object({
      tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), title: z.string().trim().min(1).max(500),
      posterPath: z.string().max(500).nullable().optional(), releaseDate: z.string().max(16).nullable().optional(), plannedFor,
      note: z.string().trim().max(1000).nullable().optional(), monitorAvailability: z.boolean().optional(), availabilityRegion: z.string().regex(/^[A-Z]{2}$/).optional(),
      providerNames: z.array(z.string().trim().min(1).max(150)).max(100), offers: z.array(snapshotOffer).max(200).optional(),
      availabilityCheckedAt: z.coerce.date().nullable().optional(), availabilitySourceUrl: z.string().url().max(1024).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const item = await addWatchlistItem(ctx.user.id, { ...input, providerNamesJson: JSON.stringify(input.providerNames), availabilityRegion: input.availabilityRegion ?? "US", availabilityCheckedAt: input.availabilityCheckedAt ?? null, availabilitySourceUrl: input.availabilitySourceUrl ?? null });
      const normalizedOffers = normalizeOffers(input.offers ?? []);
      if (item && normalizedOffers.length && input.availabilityCheckedAt) await addAvailabilitySnapshot({ watchlistItemId: item.id, region: input.availabilityRegion ?? "US", offersJson: JSON.stringify(normalizedOffers), fingerprint: offersFingerprint(normalizedOffers), sourceUrl: input.availabilitySourceUrl ?? null, checkedAt: input.availabilityCheckedAt });
      return { success: true, id: item?.id ?? null };
    }),
    setIntent: protectedProcedure.input(z.object({ id: z.number().int().positive(), plannedFor })).mutation(async ({ ctx, input }) => { await updateWatchlistIntent(ctx.user.id, input.id, input.plannedFor); return { success: true }; }),
    setNote: protectedProcedure.input(z.object({ id: z.number().int().positive(), note: z.string().trim().max(1000).nullable() })).mutation(async ({ ctx, input }) => { await updateWatchlistNote(ctx.user.id, input.id, input.note || null); return { success: true }; }),
    setMonitoring: protectedProcedure.input(z.object({ id: z.number().int().positive(), monitorAvailability: z.boolean() })).mutation(async ({ ctx, input }) => { await updateWatchlistMonitoring(ctx.user.id, input.id, input.monitorAvailability); return { success: true }; }),
    history: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getSnapshotHistory(ctx.user.id, input.id)),
    refresh: protectedProcedure.input(z.object({ id: z.number().int().positive(), language: z.string().default("en-US") })).mutation(({ ctx, input }) => refreshTrackedTitle(ctx.user.id, input.id, input.language)),
    refreshTracked: protectedProcedure.input(z.object({ language: z.string().default("en-US") })).mutation(({ ctx, input }) => refreshTrackedTitlesForUser(ctx.user.id, input.language)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await removeWatchlistItem(ctx.user.id, input.id); return { success: true }; }),
  }),
  alerts: router({
    preferences: protectedProcedure.query(({ ctx }) => getAlertPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure.input(z.object({ availabilityChangesEnabled: z.boolean(), renewalRemindersEnabled: z.boolean(), pauseRemindersEnabled: z.boolean(), renewalLeadDays: z.number().int().min(1).max(60), inAppEnabled: z.boolean() })).mutation(({ ctx, input }) => updateAlertPreferences(ctx.user.id, input)),
    list: protectedProcedure.query(async ({ ctx }) => { await syncRenewalAlerts(ctx.user.id); return getAlerts(ctx.user.id); }),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await markAlertRead(ctx.user.id, input.id); return { success: true }; }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => { await markAllAlertsRead(ctx.user.id); return { success: true }; }),
  }),
  subscriptions: router({
    list: protectedProcedure.query(({ ctx }) => getSubscriptions(ctx.user.id)),
    activity: protectedProcedure.query(({ ctx }) => getSubscriptionActions(ctx.user.id)),
    add: protectedProcedure.input(subscriptionInput).mutation(async ({ ctx, input }) => { await addSubscription(ctx.user.id, { ...input, price: input.price.toFixed(2) }); return { success: true }; }),
    update: protectedProcedure.input(subscriptionInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const { id, ...rest } = input; await updateSubscription(ctx.user.id, id, { ...rest, price: rest.price.toFixed(2) }); return { success: true }; }),
    action: protectedProcedure.input(z.object({ id: z.number().int().positive(), actionType: lifecycleAction, note: z.string().trim().max(1000).nullable().optional(), pauseUntil: z.coerce.date().nullable().optional() })).mutation(async ({ ctx, input }) => {
      await applySubscriptionAction(ctx.user.id, input.id, input.actionType, input.note ?? null, input.pauseUntil ?? null);
      const preferences = await getAlertPreferences(ctx.user.id);
      if (preferences.inAppEnabled) await createAlert({ userId: ctx.user.id, type: "subscription_action", title: "Subscription status updated", body: `You marked a subscription as ${input.actionType.replace(/_/g, " ")}.`, payloadJson: JSON.stringify({ subscriptionId: input.id, actionType: input.actionType }) });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await removeSubscription(ctx.user.id, input.id); return { success: true }; }),
  }),
  decisions: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const [wallet, watchlist] = await Promise.all([getSubscriptions(ctx.user.id), getWatchlist(ctx.user.id)]);
      const normalizedWatchlist = watchlist.map(item => ({ ...item, providerNames: parseProviderNames(item.providerNamesJson), availabilityCheckedAt: item.availabilityCheckedAt }));
      const normalizedSubscriptions = wallet.map(item => ({ ...item, price: Number(item.price) }));
      return buildSubscriptionDecisions(normalizedSubscriptions, normalizedWatchlist);
    }),
  }),
});

function parseProviderNames(raw: string) { try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []; } catch { return []; } }
export type AppRouter = typeof appRouter;
