import { afterEach, describe, expect, it, vi } from "vitest";
import { getStreamingAvailabilityExpiryChanges, getStreamingAvailabilityUpcomingChanges, setStreamingAvailabilityKeyForTests } from "./catalog";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => { fetchMock.mockReset(); setStreamingAvailabilityKeyForTests(undefined); });

describe("Streaming Availability changes", () => {
  it("stays inactive with no configured provider key", async () => {
    expect((await getStreamingAvailabilityExpiryChanges("IN")).status).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("maps documented show tmdbId and expiry data without using it as a web claim", async () => {
    setStreamingAvailabilityKeyForTests("test-key");
    fetchMock.mockResolvedValue({ ok: true, status: 200, headers: new Headers(), json: async () => ({ shows: [{ id: "show-1", tmdbId: "movie/27205", showType: "movie", title: "Inception" }], changes: [{ showId: "show-1", showType: "movie", service: { name: "Netflix" }, streamingOptionType: "subscription", timestamp: 1_800_000_000, link: "https://provider.example/title" }] }) });
    const result = await getStreamingAvailabilityExpiryChanges("IN");
    expect(result).toMatchObject({ status: "available", entries: [{ tmdbId: 27205, mediaType: "movie", providerName: "Netflix", providerType: "subscription" }] });
    expect(fetchMock.mock.calls[0]?.[0]).toContain("change_type=expiring");
  });
  it("maps an exact provider-announced upcoming date without treating it as a current offer", async () => {
    setStreamingAvailabilityKeyForTests("test-key");
    fetchMock.mockResolvedValue({ ok: true, status: 200, headers: new Headers(), json: async () => ({ shows: [{ id: "show-2", tmdbId: "movie/27205", showType: "movie", title: "Inception" }], changes: [{ showId: "show-2", showType: "movie", service: { name: "Netflix" }, streamingOptionType: "subscription", timestamp: 1_800_000_000, link: "https://provider.example/title" }] }) });
    const result = await getStreamingAvailabilityUpcomingChanges("IN");
    expect(result).toMatchObject({ status: "available", entries: [{ tmdbId: 27205, mediaType: "movie", providerName: "Netflix", providerType: "subscription" }] });
    expect(result.entries[0]?.announcedFor).toBeInstanceOf(Date);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("change_type=upcoming");
  });
  it("applies a bounded retry period after the provider reports its quota is exhausted", async () => {
    setStreamingAvailabilityKeyForTests("test-key");
    fetchMock.mockResolvedValue({ ok: false, status: 429, headers: new Headers({ "retry-after": "90" }) });
    const first = await getStreamingAvailabilityExpiryChanges("IN"); const second = await getStreamingAvailabilityExpiryChanges("IN");
    expect(first.status).toBe("rate_limited"); expect(second.status).toBe("rate_limited"); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
