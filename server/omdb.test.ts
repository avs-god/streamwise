import { afterEach, describe, expect, it, vi } from "vitest";
import { getOmdbRatings, setOmdbKeyForTests } from "./omdb";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => { fetchMock.mockReset(); setOmdbKeyForTests(null); });

describe("OMDb ratings adapter", () => {
  it("stays inactive without a configured server-side key", async () => {
    expect((await getOmdbRatings({ title: "Example", releaseDate: null, mediaType: "movie" })).status).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns only matched, source-labelled rating metadata", async () => {
    setOmdbKeyForTests("test-key");
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ Response: "True", Title: "Example Film", Year: "2025", imdbID: "tt123", Ratings: [{ Source: "Internet Movie Database", Value: "7.2/10" }, { Source: "Rotten Tomatoes", Value: "89%" }, { Source: "Unknown", Value: "55" }] }) });
    const result = await getOmdbRatings({ title: "Example Film", releaseDate: "2025-04-02", mediaType: "movie" });
    expect(result).toMatchObject({ status: "available", imdbId: "tt123", ratings: [{ source: "IMDb", value: "7.2/10" }, { source: "Rotten Tomatoes", value: "89%" }] });
    expect(fetchMock.mock.calls[0]?.[0]).toContain("t=Example+Film");
    expect(JSON.stringify(result)).not.toContain("test-key");
  });

  it("does not substitute a differently matched title", async () => {
    setOmdbKeyForTests("test-key");
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ Response: "True", Title: "Another Film" }) });
    expect((await getOmdbRatings({ title: "Example Film", releaseDate: null, mediaType: "movie" })).status).toBe("not_found");
  });
});
