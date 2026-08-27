import { afterEach, describe, expect, it, vi } from "vitest";
import { searchAnimeCatalog, setAnimeRateLimitForTests } from "./anime";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => { fetchMock.mockReset(); setAnimeRateLimitForTests(0); });

describe("AniList anime discovery", () => {
  it("maps bounded AniList discovery metadata without asserting legal availability", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { Page: { media: [{ id: 1, title: { userPreferred: "Cowboy Bebop", english: "Cowboy Bebop", native: "カウボーイビバップ" }, format: "TV", episodes: 26, genres: ["Action", "Sci-Fi"], description: "A series", coverImage: { large: "https://image.example/cover.jpg" }, averageScore: 86, status: "FINISHED", startDate: { year: 1998, month: 4, day: 3 }, siteUrl: "https://anilist.co/anime/1" }] } } }) });
    await expect(searchAnimeCatalog("Cowboy Bebop")).resolves.toMatchObject({ status: "available", titles: [{ id: 1, title: "Cowboy Bebop", format: "TV", averageScore: 86 }] });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://graphql.anilist.co");
  });
  it("returns a bounded rate-limited state after AniList responds with 429", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    expect((await searchAnimeCatalog("Frieren")).status).toBe("rate_limited");
    expect((await searchAnimeCatalog("Frieren")).status).toBe("rate_limited");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
