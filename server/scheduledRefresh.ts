import type { Request, Response } from "express";
import { getActivePublicLeavingSoonResearch, getOptedInRefreshUserIds, getScheduledJobByTaskUid, getTrackedTitleRegions, upsertConfirmedProviderDeparture, upsertPublicLeavingSoonResearch } from "./db";
import { syncRenewalAlerts } from "./alertService";
import { refreshTrackedTitlesForUser } from "./trackingService";
import { getStreamingAvailabilityExpiryChanges, isCatalogConfigured } from "./catalog";
import { sdk } from "./_core/sdk";
import { researchDiscoveryLead } from "./aiDiscovery";
import { refreshUpcomingStreamingSignals } from "./releaseSignals";

export const STREAMWISE_REFRESH_JOB_KEY = "streamwise-opt-in-refresh";

export async function refreshProviderExpirySignals() {
  const tracked = await getTrackedTitleRegions();
  const byRegion = new Map<string, typeof tracked>();
  for (const item of tracked) byRegion.set(item.region, [...(byRegion.get(item.region) ?? []), item]);
  let matched = 0; let entries = 0; const statuses: Record<string, string> = {};
  for (const [region, titles] of Array.from(byRegion.entries()).slice(0, 4)) {
    const changeFeed = await getStreamingAvailabilityExpiryChanges(region);
    statuses[region] = changeFeed.status;
    entries += changeFeed.entries.length;
    const titleByKey = new Map(titles.map(title => [`${title.tmdbId}:${title.mediaType}`, title]));
    for (const entry of changeFeed.entries) {
      const title = titleByKey.get(`${entry.tmdbId}:${entry.mediaType}`);
      if (!title) continue;
      await upsertConfirmedProviderDeparture({ tmdbId: entry.tmdbId, mediaType: entry.mediaType, region, title: title.title, providerName: entry.providerName, providerType: entry.providerType, sourceKind: "change_feed", sourceUrl: entry.sourceUrl, observedAt: changeFeed.checkedAt ?? new Date(), expiresAt: entry.expiresAt });
      matched += 1;
    }
  }
  return { trackedTitles: tracked.length, regionsChecked: byRegion.size, changeEntries: entries, matchedExpirySignals: matched, statuses };
}

/** Bounded, source-linked public-web context only. It never creates legal availability, departure, or alert data. */
export async function refreshPublicLeavingSoonContext() {
  const tracked = (await getTrackedTitleRegions()).slice(0, 4);
  let refreshed = 0; let skippedFresh = 0; let unavailable = 0;
  for (const title of tracked) {
    const cached = await getActivePublicLeavingSoonResearch(title);
    if (cached && new Date(cached.searchedAt).getTime() > Date.now() - 20 * 60 * 60 * 1000) { skippedFresh += 1; continue; }
    const searchedAt = new Date();
    try {
      const research = await researchDiscoveryLead({ query: `Leaving soon public-web context: ${title.title}. Search for current reporting and public discussion about whether this title may be leaving a streaming provider in ${title.region}. State uncertainty and source attribution; do not call it confirmed legal availability.`, region: title.region, language: "en-US" });
      await upsertPublicLeavingSoonResearch({ ...title, directResponse: research.directResponse, sources: research.sources, communitySources: research.communitySources, status: research.status, searchedAt, expiresAt: new Date(searchedAt.getTime() + 20 * 60 * 60 * 1000) });
      refreshed += 1;
    } catch {
      await upsertPublicLeavingSoonResearch({ ...title, directResponse: "Public-web Leaving Soon research could not be refreshed in this session. Check the legal catalog for current country-specific offers.", sources: [], communitySources: [], status: "unavailable", searchedAt, expiresAt: new Date(searchedAt.getTime() + 3 * 60 * 60 * 1000) });
      unavailable += 1;
    }
  }
  return { candidates: tracked.length, refreshed, skippedFresh, unavailable };
}

export async function runOptInRefreshBatch() {
  const users = await getOptedInRefreshUserIds();
  const catalogConfigured = isCatalogConfigured();
  let refreshedTitles = 0;
  let changedTitles = 0;
  for (const user of users) {
    await syncRenewalAlerts(user.id);
    if (catalogConfigured) {
      const result = await refreshTrackedTitlesForUser(user.id, "en-US");
      refreshedTitles += result.checked;
      changedTitles += result.changed;
    }
  }
  const providerExpiry = await refreshProviderExpirySignals();
  const upcomingStreaming = await refreshUpcomingStreamingSignals();
  const publicWebContext = await refreshPublicLeavingSoonContext();
  return { usersProcessed: users.length, catalogConfigured, refreshedTitles, changedTitles, providerExpiry, upcomingStreaming, publicWebContext };
}

export async function streamwiseRefreshHandler(req: Request, res: Response) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
    const job = await getScheduledJobByTaskUid(cronUser.taskUid);
    if (!job) return res.json({ ok: true, skipped: "orphan-cron" });
    if (job.jobKey !== STREAMWISE_REFRESH_JOB_KEY) return res.status(403).json({ error: "unrecognized-cron" });
    const result = await runOptInRefreshBatch();
    return res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "scheduled-refresh-failed", timestamp: new Date().toISOString() });
  }
}
