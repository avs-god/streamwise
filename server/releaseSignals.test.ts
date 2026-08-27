import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveAnnouncedStreamingReleases: vi.fn(), getTrackedTitleRegions: vi.fn(), upsertAnnouncedStreamingRelease: vi.fn(),
  getCurrentTheatricalStatus: vi.fn(), getStreamingAvailabilityUpcomingChanges: vi.fn(),
}));
vi.mock("./db", () => ({ getActiveAnnouncedStreamingReleases: mocks.getActiveAnnouncedStreamingReleases, getTrackedTitleRegions: mocks.getTrackedTitleRegions, upsertAnnouncedStreamingRelease: mocks.upsertAnnouncedStreamingRelease }));
vi.mock("./catalog", () => ({ getCurrentTheatricalStatus: mocks.getCurrentTheatricalStatus, getStreamingAvailabilityUpcomingChanges: mocks.getStreamingAvailabilityUpcomingChanges }));
import { getTitleReleaseSignals, refreshUpcomingStreamingSignals } from "./releaseSignals";

describe("source-labelled release signals", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("composes current theatrical status separately from persisted provider announcements", async () => {
    mocks.getCurrentTheatricalStatus.mockResolvedValue({ configured: true, status: "listed", sourceUrl: "https://tmdb.example", checkedAt: "2026-08-27T00:00:00.000Z" });
    mocks.getActiveAnnouncedStreamingReleases.mockResolvedValue([{ providerName: "Netflix", announcedFor: new Date("2026-09-01") }]);
    await expect(getTitleReleaseSignals({ tmdbId: 1, mediaType: "movie", region: "IN", language: "en-US" })).resolves.toMatchObject({ theatrical: { status: "listed" }, announcedStreaming: [{ providerName: "Netflix" }] });
  });
  it("stores only tracked title matches from a provider upcoming feed", async () => {
    mocks.getTrackedTitleRegions.mockResolvedValue([{ tmdbId: 1, mediaType: "movie", title: "Tracked", region: "IN" }]);
    mocks.getStreamingAvailabilityUpcomingChanges.mockResolvedValue({ status: "available", checkedAt: new Date("2026-08-27"), entries: [{ tmdbId: 1, mediaType: "movie", title: "Provider title", providerName: "Netflix", providerType: "subscription", announcedFor: new Date("2026-09-01"), sourceUrl: "https://provider.example" }, { tmdbId: 2, mediaType: "movie", title: "Untracked", providerName: "Netflix", providerType: "subscription", announcedFor: new Date("2026-09-01"), sourceUrl: null }] });
    await expect(refreshUpcomingStreamingSignals()).resolves.toMatchObject({ trackedTitles: 1, regionsChecked: 1, changeEntries: 2, matchedAnnouncements: 1, statuses: { IN: "available" } });
    expect(mocks.upsertAnnouncedStreamingRelease).toHaveBeenCalledTimes(1);
    expect(mocks.upsertAnnouncedStreamingRelease).toHaveBeenCalledWith(expect.objectContaining({ tmdbId: 1, title: "Tracked", providerName: "Netflix" }));
  });
  it("does not persist a provider-rate-limited upcoming feed", async () => {
    mocks.getTrackedTitleRegions.mockResolvedValue([{ tmdbId: 1, mediaType: "movie", title: "Tracked", region: "IN" }]);
    mocks.getStreamingAvailabilityUpcomingChanges.mockResolvedValue({ status: "rate_limited", checkedAt: new Date(), entries: [] });
    await expect(refreshUpcomingStreamingSignals()).resolves.toMatchObject({ matchedAnnouncements: 0, statuses: { IN: "rate_limited" } });
    expect(mocks.upsertAnnouncedStreamingRelease).not.toHaveBeenCalled();
  });
});
