import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { providerGuides } from "../shared/providers";
import {
  addSubscription,
  addWatchlistItem,
  getSubscriptions,
  getWatchlist,
  removeSubscription,
  removeWatchlistItem,
  updateWatchlistNote,
  updateSubscription,
  updateWatchlistIntent,
} from "./db";
import { getCatalogDetail, isCatalogConfigured, searchCatalog } from "./catalog";
import { buildSubscriptionDecisions } from "./recommendations";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const plannedFor = z.enum(["this_week", "this_month", "someday"]);
const billingCycle = z.enum(["monthly", "quarterly", "yearly"]);
const viewingIntent = z.enum(["watch_now", "considering", "keep"]);

const subscriptionInput = z.object({
  providerName: z.string().trim().min(1).max(150),
  planName: z.string().trim().min(1).max(150),
  price: z.number().finite().nonnegative().max(1_000_000),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  billingCycle,
  renewalDate: z.coerce.date().nullable(),
  viewingIntent,
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    status: publicProcedure.query(() => ({ configured: isCatalogConfigured(), provider: "TMDb / JustWatch" })),
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(2).max(120), language: z.string().default("en-US") }))
      .query(({ input }) => searchCatalog(input)),
    title: publicProcedure
      .input(z.object({ id: z.number().int().positive(), mediaType: z.enum(["movie", "tv"]), region: z.string(), language: z.string().default("en-US") }))
      .query(({ input }) => getCatalogDetail(input)),
  }),
  providers: router({
    list: publicProcedure.query(() => providerGuides),
  }),
  watchlist: router({
    list: protectedProcedure.query(({ ctx }) => getWatchlist(ctx.user.id)),
    add: protectedProcedure
      .input(z.object({
        tmdbId: z.number().int().positive(),
        mediaType: z.enum(["movie", "tv"]),
        title: z.string().trim().min(1).max(500),
        posterPath: z.string().max(500).nullable().optional(),
        releaseDate: z.string().max(16).nullable().optional(),
        plannedFor,
        note: z.string().trim().max(1000).nullable().optional(),
        providerNames: z.array(z.string().trim().min(1).max(150)).max(100),
        availabilityCheckedAt: z.coerce.date().nullable().optional(),
        availabilitySourceUrl: z.string().url().max(1024).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await addWatchlistItem(ctx.user.id, {
          ...input,
          providerNamesJson: JSON.stringify(input.providerNames),
          availabilityCheckedAt: input.availabilityCheckedAt ?? null,
          availabilitySourceUrl: input.availabilitySourceUrl ?? null,
        });
        return { success: true };
      }),
    setIntent: protectedProcedure.input(z.object({ id: z.number().int().positive(), plannedFor })).mutation(async ({ ctx, input }) => {
      await updateWatchlistIntent(ctx.user.id, input.id, input.plannedFor);
      return { success: true };
    }),
    setNote: protectedProcedure.input(z.object({ id: z.number().int().positive(), note: z.string().trim().max(1000).nullable() })).mutation(async ({ ctx, input }) => {
      await updateWatchlistNote(ctx.user.id, input.id, input.note || null);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await removeWatchlistItem(ctx.user.id, input.id);
      return { success: true };
    }),
  }),
  subscriptions: router({
    list: protectedProcedure.query(({ ctx }) => getSubscriptions(ctx.user.id)),
    add: protectedProcedure.input(subscriptionInput).mutation(async ({ ctx, input }) => {
      await addSubscription(ctx.user.id, { ...input, price: input.price.toFixed(2) });
      return { success: true };
    }),
    update: protectedProcedure.input(subscriptionInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await updateSubscription(ctx.user.id, id, { ...rest, price: rest.price.toFixed(2) });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await removeSubscription(ctx.user.id, input.id);
      return { success: true };
    }),
  }),
  decisions: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const [wallet, watchlist] = await Promise.all([getSubscriptions(ctx.user.id), getWatchlist(ctx.user.id)]);
      const normalizedWatchlist = watchlist.map(item => ({
        ...item,
        providerNames: parseProviderNames(item.providerNamesJson),
        availabilityCheckedAt: item.availabilityCheckedAt,
      }));
      const normalizedSubscriptions = wallet.map(item => ({ ...item, price: Number(item.price) }));
      return buildSubscriptionDecisions(normalizedSubscriptions, normalizedWatchlist);
    }),
  }),
});

function parseProviderNames(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export type AppRouter = typeof appRouter;
