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
  getActiveConfirmedProviderDepartures,
  getActivePublicLeavingSoonResearch,
  getProviderAlertSubscriptions,
  getAlerts,
  getCommunityPosts,
  getPendingCommunityPosts,
  getCommunityThreadReports,
  getCommunityTitleRatingSummary,
  getCommunityTitleLeavingSoonSignals,
  getCommunityTitleReviews,
  getCommunityThreads,
  getThreadReplies,
  getCommunityReports,
  getSnapshotHistory,
  getSubscriptionActions,
  getSubscriptions,
  getTasteProfile,
  getViewingSignals,
  getWatchlist,
  markAlertRead,
  markAllAlertsRead,
  reportCommunityPost,
  reportCommunityThread,
  removeSubscription,
  removeViewingSignal,
  removeWatchlistItem,
  recordViewingSignal,
  updateAlertPreferences,
  updateSubscription,
  updateWatchlistIntent,
  updateWatchlistMonitoring,
  updateWatchlistNote,
  upsertTasteProfile,
  setCommunityPostStatus,
  setCommunityPostStatuses,
  setCommunityReportStatuses,
  setCommunityTitleRating,
  setCommunityThreadStatus,
  setCommunityThreadReplyStatus,
  setProviderAlertSubscription,
} from "./db";
import { discoverCatalog, getCatalogDetail, getRecommendedCatalogTitles, getSimilarCatalogTitles, getTmdbReviews, isCatalogConfigured, mergePostWatchRecommendations, recommendCatalogFromIntent, searchCatalog } from "./catalog";
import { getOmdbRatings } from "./omdb";
import { refreshTrackedTitle, refreshTrackedTitlesForUser } from "./trackingService";
import { syncRenewalAlerts } from "./alertService";
import { researchDiscoveryLead } from "./aiDiscovery";
import { interpretRecommendationPrompt } from "./aiRecommendations";
import { askPersonalAssistant } from "./personalAssistant";
import { getEmailDeliveryStatus } from "./email";
import { getBrowserPushDeliveryStatus } from "./browserPush";
import { getTitleReleaseSignals } from "./releaseSignals";
import { getAnimeLegalAvailability, searchAnimeCatalog } from "./anime";
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
  reportedLeavingAt: z.coerce.date().nullable().optional(), switchesToProviderName: z.string().trim().min(1).max(150).nullable().optional(),
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
    recommended: publicProcedure.input(z.object({ id: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), language: z.string().default("en-US") })).query(({ input }) => getRecommendedCatalogTitles(input)),
    reviews: publicProcedure.input(z.object({ id: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), language: z.string().default("en-US") })).query(({ input }) => getTmdbReviews(input)),
  }),
  ratings: router({
    omdb: publicProcedure.input(z.object({ title: z.string().trim().min(1).max(500), releaseDate: z.string().max(16).nullable(), mediaType: z.enum(["movie", "tv"]), imdbId: z.string().regex(/^tt\d+$/).nullable().optional() })).query(({ input }) => getOmdbRatings(input)),
  }),
  ai: router({
    research: protectedProcedure.input(z.object({ query: z.string().trim().min(3).max(220), region: z.string().regex(/^[A-Z]{2}$/), language: z.string().min(2).max(20) })).mutation(({ input }) => researchDiscoveryLead(input)),
    recommend: publicProcedure.input(z.object({ prompt: z.string().trim().min(3).max(500), conversationContext: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1600) })).max(6).optional(), region: z.string().regex(/^[A-Z]{2}$/).default("IN"), language: z.string().min(2).max(20).default("en-US") })).mutation(async ({ ctx, input }) => {
      const contextualPrompt = input.conversationContext?.length ? `${input.conversationContext.map(message => `${message.role}: ${message.content}`).join("\n")}\nuser: ${input.prompt}` : input.prompt;
      const interpretation = await interpretRecommendationPrompt(contextualPrompt);
      const savedProfile = ctx.user ? await getTasteProfile(ctx.user.id) : null;
      let savedLanguages: string[] = [];
      let savedGenres: number[] = [];
      try { const value = JSON.parse(savedProfile?.preferredLanguagesJson ?? "[]"); savedLanguages = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && /^[a-z]{2}$/.test(item)) : []; } catch { /* Invalid legacy profile values are ignored. */ }
      try { const value = JSON.parse(savedProfile?.favoriteGenresJson ?? "[]"); savedGenres = Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item) && item > 0) : []; } catch { /* Invalid legacy profile values are ignored. */ }
      const savedMediaType = savedProfile && savedProfile.includeMovies !== savedProfile.includeSeries ? savedProfile.includeMovies ? "movie" as const : "tv" as const : "all" as const;
      const resolvedIntent = { ...interpretation, genreId: interpretation.genreId ?? savedGenres[0] ?? null, mediaType: interpretation.mediaType === "all" ? savedMediaType : interpretation.mediaType, originalLanguage: interpretation.originalLanguage ?? savedLanguages[0] ?? null, maxRuntimeMinutes: interpretation.maxRuntimeMinutes ?? savedProfile?.maxRuntimeMinutes ?? null };
      const catalog = await recommendCatalogFromIntent(resolvedIntent, input.language);
      const topPicks = catalog.titles.slice(0, 3).map(title => ({ id: title.id, title: title.title, mediaType: title.mediaType, releaseDate: title.releaseDate }));
      const catalogueLine = topPicks.length ? topPicks.map((title, index) => `${index + 1}. ${title.title}${title.releaseDate ? ` (${title.releaseDate.slice(0, 4)})` : ""}`).join("; ") : "No catalog candidates were returned.";
      const research = ctx.user ? await researchDiscoveryLead({ query: `Recommendation conversation: ${input.prompt}\nCatalog-backed top candidates: ${catalogueLine}\nGive a concise decision-oriented reading of public criticism, movie-blog commentary, and clearly labelled public discussion. Do not reproduce IMDb or Rotten Tomatoes scores, ratings, or review text without a licensed source. Do not claim web discussion proves availability or rank the catalog candidates from web claims alone.`, region: input.region, language: input.language }) : null;
      const opening = topPicks[0] ? `I’d start with ${topPicks[0].title}${topPicks[0].releaseDate ? ` (${topPicks[0].releaseDate.slice(0, 4)})` : ""}.` : "I could not find a confident catalog starting point for that request.";
      const rationale = `I read your request as: ${resolvedIntent.explanation}`;
      const nextStep = topPicks.length ? "Open a pick to compare current legal offers in your country, then continue the conversation if you want a different mood or pace." : "Try naming a title you liked, a mood, a genre, or the amount of time you have.";
      return { ...catalog, interpretation: resolvedIntent, conversation: { reply: `${opening} ${rationale}`, rationale, nextStep, usedSavedTaste: Boolean(savedProfile && (savedGenres.length || savedLanguages.length || savedProfile.maxRuntimeMinutes || savedMediaType !== "all")), topPicks, research } };
    }),
  }),
  assistant: router({
    ask: protectedProcedure.input(z.object({ question: z.string().trim().min(2).max(750) })).mutation(({ ctx, input }) => askPersonalAssistant(ctx.user.id, input.question)),
    command: protectedProcedure.input(z.object({ command: z.string().trim().min(3).max(300) })).mutation(async ({ ctx, input }) => {
      const normalized = input.command.toLowerCase();
      const [watchlist, wallet] = await Promise.all([getWatchlist(ctx.user.id), getSubscriptions(ctx.user.id)]);
      const watch = watchlist.find(item => normalized.includes(item.title.toLowerCase()));
      const service = wallet.find(item => normalized.includes(item.providerName.toLowerCase()));
      if (watch && /remove|delete/.test(normalized)) return { kind: "remove_watchlist" as const, id: watch.id, label: `Remove “${watch.title}” from your watchlist`, confirmation: "This removes the saved title and its private availability snapshots." };
      if (service && /cancel|stop/.test(normalized)) return { kind: "plan_cancellation" as const, id: service.id, label: `Plan cancellation for ${service.providerName}`, confirmation: "This marks the subscription for cancellation; it does not contact the provider or cancel billing." };
      if (service && /pause/.test(normalized)) return { kind: "pause_subscription" as const, id: service.id, label: `Pause ${service.providerName} in your Streamwise wallet`, confirmation: "This updates only your private Streamwise record; it does not contact the provider." };
      return { kind: "none" as const, id: null, label: "No safe action was identified", confirmation: "Try: ‘remove [title] from my watchlist’, ‘pause [service]’, or ‘plan cancellation for [service]’." };
    }),
    executeCommand: protectedProcedure.input(z.object({ kind: z.enum(["remove_watchlist", "plan_cancellation", "pause_subscription"]), id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (input.kind === "remove_watchlist") { await removeWatchlistItem(ctx.user.id, input.id); return { success: true, message: "Removed the title from your watchlist." }; }
      const action = input.kind === "pause_subscription" ? "paused" : "cancellation_planned";
      await applySubscriptionAction(ctx.user.id, input.id, action, null, null);
      return { success: true, message: action === "paused" ? "Updated your private wallet record to paused." : "Marked your private wallet record for cancellation." };
    }),
  }),
  tasteProfile: router({
    get: protectedProcedure.query(({ ctx }) => getTasteProfile(ctx.user.id)),
    save: protectedProcedure.input(z.object({ favoriteGenreIds: z.array(z.number().int().positive()).max(12), preferredLanguages: z.array(z.string().regex(/^[a-z]{2}$/)).max(12), maxRuntimeMinutes: z.number().int().min(30).max(360).nullable(), includeMovies: z.boolean(), includeSeries: z.boolean(), defaultRegion: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).default("IN"), interfaceDensity: z.enum(["comfortable", "compact"]).default("comfortable"), reducedMotion: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      if (!input.includeMovies && !input.includeSeries) throw new Error("Choose films, series, or both.");
      await upsertTasteProfile(ctx.user.id, { favoriteGenresJson: JSON.stringify(input.favoriteGenreIds), preferredLanguagesJson: JSON.stringify(input.preferredLanguages), maxRuntimeMinutes: input.maxRuntimeMinutes, includeMovies: input.includeMovies, includeSeries: input.includeSeries, defaultRegion: input.defaultRegion, interfaceDensity: input.interfaceDensity, reducedMotion: input.reducedMotion });
      return { success: true };
    }),
  }),
  providers: router({ list: publicProcedure.query(() => providerGuides) }),
  anime: router({
    search: publicProcedure.input(z.object({ query: z.string().trim().min(2).max(160) })).query(({ input }) => searchAnimeCatalog(input.query)),
    availability: publicProcedure.input(z.object({ title: z.string().trim().min(1).max(500), englishTitle: z.string().trim().max(500).nullable(), nativeTitle: z.string().trim().max(500).nullable(), region: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/), language: z.string().trim().min(2).max(16).default("en-US") })).query(({ input }) => getAnimeLegalAvailability(input)),
  }),
  community: router({
    list: publicProcedure.input(z.object({ region: z.string().regex(/^[A-Z]{2}$/).optional(), kind: communityKind.optional() }).optional()).query(({ input }) => getCommunityPosts(input ?? {})),
    contribute: protectedProcedure.input(communityPostInput).mutation(async ({ ctx, input }) => { await createCommunityPost(ctx.user.id, { ...input, tmdbId: input.tmdbId ?? null, providerName: input.providerName ?? null, reportedLeavingAt: input.reportedLeavingAt ?? null, switchesToProviderName: input.switchesToProviderName ?? null, sourceUrl: input.sourceUrl ?? null }); return { success: true }; }),
    report: protectedProcedure.input(z.object({ postId: z.number().int().positive(), reason: z.enum(["misleading", "spam", "abuse", "privacy", "other"]), detail: z.string().trim().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => { await reportCommunityPost(ctx.user.id, input.postId, { reason: input.reason, detail: input.detail ?? null }); return { success: true }; }),
    titleRatingSummary: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]) })).query(({ input }) => getCommunityTitleRatingSummary(input)),
    titleLeavingSoonSignals: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]) })).query(({ input }) => getCommunityTitleLeavingSoonSignals(input)),
    titleReviews: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]) })).query(({ input }) => getCommunityTitleReviews(input)),
    setTitleRating: protectedProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), rating: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => { await setCommunityTitleRating(ctx.user.id, input); return { success: true }; }),
    threads: publicProcedure.input(z.object({ tmdbId: z.number().int().positive().optional(), mediaType: z.enum(["movie", "tv", "unknown"]).optional(), topic: threadTopic.optional() }).optional()).query(({ input }) => getCommunityThreads(input ?? {})),
    createThread: protectedProcedure.input(threadInput).mutation(async ({ ctx, input }) => { await createCommunityThread(ctx.user.id, { ...input, tmdbId: input.tmdbId ?? null }); return { success: true }; }),
    replies: publicProcedure.input(z.object({ threadId: z.number().int().positive() })).query(({ input }) => getThreadReplies(input.threadId)),
    reply: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), parentReplyId: z.number().int().positive().nullable().optional(), body: z.string().trim().min(2).max(4000), containsSpoilers: z.boolean(), shareAttribution: z.boolean() })).mutation(async ({ ctx, input }) => { await createThreadReply(ctx.user.id, { ...input, parentReplyId: input.parentReplyId ?? null }); return { success: true }; }),
    reportThread: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), replyId: z.number().int().positive().nullable().optional(), reason: z.enum(["spoiler", "misleading", "spam", "abuse", "privacy", "other"]), detail: z.string().trim().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => { await reportCommunityThread(ctx.user.id, { ...input, replyId: input.replyId ?? null, detail: input.detail ?? null }); return { success: true }; }),
    moderation: router({
      reports: adminProcedure.query(() => getCommunityReports()),
      pendingPosts: adminProcedure.query(() => getPendingCommunityPosts()),
      threadReports: adminProcedure.query(() => getCommunityThreadReports()),
      setStatus: adminProcedure.input(z.object({ postId: z.number().int().positive(), status: z.enum(["pending", "visible", "hidden", "removed"]) })).mutation(async ({ input }) => { await setCommunityPostStatus(input.postId, input.status); return { success: true }; }),
      bulkSetStatus: adminProcedure.input(z.object({ postIds: z.array(z.number().int().positive()).min(1).max(50), status: z.enum(["visible", "hidden", "removed"]) })).mutation(async ({ input }) => { await setCommunityPostStatuses(input.postIds, input.status); return { success: true, count: input.postIds.length }; }),
      bulkSetReportStatus: adminProcedure.input(z.object({ reportIds: z.array(z.number().int().positive()).min(1).max(50), status: z.enum(["resolved", "dismissed"]) })).mutation(async ({ input }) => { await setCommunityReportStatuses(input.reportIds, input.status); return { success: true, count: input.reportIds.length }; }),
      setThreadStatus: adminProcedure.input(z.object({ threadId: z.number().int().positive(), status: z.enum(["visible", "hidden", "removed"]) })).mutation(async ({ input }) => { await setCommunityThreadStatus(input.threadId, input.status); return { success: true }; }),
      setReplyStatus: adminProcedure.input(z.object({ replyId: z.number().int().positive(), status: z.enum(["visible", "hidden", "removed"]) })).mutation(async ({ input }) => { await setCommunityThreadReplyStatus(input.replyId, input.status); return { success: true }; }),
    }),
  }),
  leavingSoon: router({
    titleSignals: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), region: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/) })).query(async ({ input }) => ({ confirmed: await getActiveConfirmedProviderDepartures(input), community: await getCommunityTitleLeavingSoonSignals(input), publicWeb: await getActivePublicLeavingSoonResearch(input) })),
  }),
  releaseSignals: router({
    title: publicProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), region: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/), language: z.string().trim().min(2).max(16).default("en-US") })).query(({ input }) => getTitleReleaseSignals(input)),
  }),
  viewingSignals: router({
    list: protectedProcedure.query(({ ctx }) => getViewingSignals(ctx.user.id)),
    record: protectedProcedure.input(z.object({ tmdbId: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), title: z.string().trim().min(1).max(500) })).mutation(async ({ ctx, input }) => { await recordViewingSignal(ctx.user.id, input); return { success: true }; }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await removeViewingSignal(ctx.user.id, input.id); return { success: true }; }),
    postWatchPicks: protectedProcedure.input(z.object({ language: z.string().default("en-US") })).query(async ({ ctx, input }) => {
      const signals = await getViewingSignals(ctx.user.id);
      if (!isCatalogConfigured()) return { configured: false, titles: [], recordedCount: signals.length, explanation: "Live catalog recommendations are not configured, so Streamwise will not invent post-watch picks." };
      if (!signals.length) return { configured: true, titles: [], recordedCount: 0, explanation: "Record titles you watched if you want private post-watch picks. Streamwise does not infer viewing history." };
      const sources = await Promise.all(signals.slice(0, 8).map(async signal => ({ sourceId: signal.tmdbId, titles: (await getRecommendedCatalogTitles({ id: signal.tmdbId, mediaType: signal.mediaType, language: input.language })).titles })));
      return { configured: true, titles: mergePostWatchRecommendations(sources, signals.map(signal => signal.tmdbId)), recordedCount: signals.length, explanation: `Catalog-derived post-watch picks from ${signals.length} title${signals.length === 1 ? "" : "s"} you explicitly recorded as watched. Streamwise does not infer viewing history.` };
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
    deliveryStatus: protectedProcedure.query(() => ({ email: getEmailDeliveryStatus(), browserPush: getBrowserPushDeliveryStatus() })),
    providerDigest: protectedProcedure.query(async ({ ctx }) => {
      const items = (await getAlerts(ctx.user.id)).filter(item => item.type === "availability_changed").slice(0, 20);
      return items.map(item => {
        let change: { region?: string; added?: Array<{ name?: string }>; removed?: Array<{ name?: string }>; checkedAt?: string } = {};
        try { change = JSON.parse(item.payloadJson) as typeof change; } catch { /* Preserve the alert even if an old payload is malformed. */ }
        return {
          id: item.id, title: item.title, createdAt: item.createdAt, region: change.region ?? null,
          addedProviders: (change.added ?? []).map(offer => offer.name).filter((name): name is string => Boolean(name)),
          removedProviders: (change.removed ?? []).map(offer => offer.name).filter((name): name is string => Boolean(name)),
          checkedAt: change.checkedAt ?? null, body: item.body,
        };
      });
    }),
    updatePreferences: protectedProcedure.input(z.object({ availabilityChangesEnabled: z.boolean(), renewalRemindersEnabled: z.boolean(), pauseRemindersEnabled: z.boolean(), renewalLeadDays: z.number().int().min(1).max(60), inAppEnabled: z.boolean(), emailEnabled: z.boolean().optional().default(false), emailRecommendationEnabled: z.boolean().optional().default(false), emailLeavingSoonEnabled: z.boolean().optional().default(false), emailCommunityEnabled: z.boolean().optional().default(false), pushEnabled: z.boolean().optional().default(false) })).mutation(({ ctx, input }) => updateAlertPreferences(ctx.user.id, input)),
    browserPushStatus: protectedProcedure.query(() => getBrowserPushDeliveryStatus()),
    saveBrowserPushSubscription: protectedProcedure.input(z.object({ endpoint: z.string().url().max(2048), p256dh: z.string().min(16).max(512), auth: z.string().min(8).max(512), userAgent: z.string().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => { const { upsertBrowserPushSubscription } = await import("./db"); await upsertBrowserPushSubscription(ctx.user.id, input); return { success: true }; }),
    removeBrowserPushSubscription: protectedProcedure.input(z.object({ endpoint: z.string().url().max(2048) })).mutation(async ({ ctx, input }) => { const { removeBrowserPushSubscription } = await import("./db"); await removeBrowserPushSubscription(ctx.user.id, input.endpoint); return { success: true }; }),
    providerSubscriptions: protectedProcedure.query(({ ctx }) => getProviderAlertSubscriptions(ctx.user.id)),
    setProviderSubscription: protectedProcedure.input(z.object({ providerName: z.string().trim().min(1).max(150), region: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/), enabled: z.boolean() })).mutation(async ({ ctx, input }) => { await setProviderAlertSubscription(ctx.user.id, input); return { success: true }; }),
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
