import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentTheatricalStatus, setCatalogAccessTokenForTests } from "./catalog";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => { fetchMock.mockReset(); setCatalogAccessTokenForTests(null); });

describe("current theatrical status", () => {
  it("stays inactive when the catalog provider is not configured", async () => {
    setCatalogAccessTokenForTests("");
    await expect(getCurrentTheatricalStatus({ id: 1, mediaType: "movie", region: "CA", language: "en-US" })).resolves.toMatchObject({ configured: false, status: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("labels only a film present in TMDb's current regional now-playing list", async () => {
    setCatalogAccessTokenForTests("test-token");
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ results: [{ id: 42 }] }) });
    const result = await getCurrentTheatricalStatus({ id: 42, mediaType: "movie", region: "CA", language: "en-US" });
    expect(result.status).toBe("listed");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/movie/now_playing");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("region=CA");
  });
});
