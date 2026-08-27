import { getActiveAnnouncedStreamingReleases, getTrackedTitleRegions, upsertAnnouncedStreamingRelease } from "./db";
import { getCurrentTheatricalStatus, getStreamingAvailabilityUpcomingChanges } from "./catalog";

export async function getTitleReleaseSignals(input: { tmdbId: number; mediaType: "movie" | "tv"; region: string; language: string }) {
  const [theatrical, announcedStreaming] = await Promise.all([
    getCurrentTheatricalStatus({ id: input.tmdbId, mediaType: input.mediaType, region: input.region, language: input.language }),
    getActiveAnnouncedStreamingReleases(input),
  ]);
  return { theatrical, announcedStreaming };
}

/** Bounded background retrieval of exact provider-announced streaming dates for explicitly tracked titles only. */
export async function refreshUpcomingStreamingSignals() {
  const tracked = await getTrackedTitleRegions();
  const byRegion = new Map<string, typeof tracked>();
  for (const item of tracked) byRegion.set(item.region, [...(byRegion.get(item.region) ?? []), item]);
  let matched = 0; let entries = 0; const statuses: Record<string, string> = {};
  for (const [region, titles] of Array.from(byRegion.entries()).slice(0, 4)) {
    const changeFeed = await getStreamingAvailabilityUpcomingChanges(region);
    statuses[region] = changeFeed.status; entries += changeFeed.entries.length;
    const trackedByKey = new Map(titles.map(title => [`${title.tmdbId}:${title.mediaType}`, title]));
    for (const entry of changeFeed.entries) {
      const title = trackedByKey.get(`${entry.tmdbId}:${entry.mediaType}`);
      if (!title) continue;
      await upsertAnnouncedStreamingRelease({ tmdbId: entry.tmdbId, mediaType: entry.mediaType, region, title: title.title, providerName: entry.providerName, providerType: entry.providerType, sourceUrl: entry.sourceUrl, announcedFor: entry.announcedFor, retrievedAt: changeFeed.checkedAt ?? new Date(), expiresAt: new Date(entry.announcedFor.getTime() + 36 * 60 * 60 * 1000) });
      matched += 1;
    }
  }
  return { trackedTitles: tracked.length, regionsChecked: Math.min(byRegion.size, 4), changeEntries: entries, matchedAnnouncements: matched, statuses };
}
