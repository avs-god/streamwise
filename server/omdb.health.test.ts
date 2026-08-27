import { describe, expect, it } from "vitest";

const runLiveHealthCheck = process.env.OMDB_LIVE_HEALTHCHECK === "1";

describe.skipIf(!runLiveHealthCheck)("OMDb deployment credential", () => {
  it("authorizes a lightweight title metadata request without exposing the key", async () => {
    const key = process.env.OMDB_API_KEY?.trim();
    expect(key).toBeTruthy();
    const response = await fetch(`https://www.omdbapi.com/?i=tt3896198&apikey=${encodeURIComponent(key!)}`);
    expect(response.ok).toBe(true);
    const payload = await response.json() as { Response?: string; Title?: string; Error?: string };
    expect(payload.Response).toBe("True");
    expect(payload.Title).toBeTruthy();
  }, 15_000);
});
