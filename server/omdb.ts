export type OmdbRating = { source: "IMDb" | "Rotten Tomatoes" | "Metacritic"; value: string };
export type OmdbRatings = { status: "available" | "not_configured" | "unavailable" | "not_found"; title: string | null; year: string | null; imdbId: string | null; ratings: OmdbRating[]; retrievedAt: string | null };

let testKeyOverride: string | null = null;
export function setOmdbKeyForTests(key: string | null) { testKeyOverride = key; }

function providerKey() {
  if (testKeyOverride !== null) return testKeyOverride;
  return process.env.VITEST ? "" : process.env.OMDB_API_KEY?.trim() ?? "";
}

function yearFrom(date: string | null) { return date?.match(/^\d{4}/)?.[0] ?? null; }
function normalize(value: string) { return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "").trim(); }

/** Retrieves only OMDb's matched-title rating metadata. The API key remains server-only. */
export async function getOmdbRatings(input: { title: string; releaseDate: string | null; mediaType: "movie" | "tv"; imdbId?: string | null }): Promise<OmdbRatings> {
  const key = providerKey();
  if (!key) return { status: "not_configured", title: null, year: null, imdbId: null, ratings: [], retrievedAt: null };
  const query = new URLSearchParams({ apikey: key });
  if (input.imdbId) query.set("i", input.imdbId);
  else {
    query.set("t", input.title);
    const year = yearFrom(input.releaseDate); if (year) query.set("y", year);
    query.set("type", input.mediaType === "movie" ? "movie" : "series");
  }
  try {
    const response = await fetch(`https://www.omdbapi.com/?${query.toString()}`);
    if (!response.ok) return { status: "unavailable", title: null, year: null, imdbId: null, ratings: [], retrievedAt: new Date().toISOString() };
    const data = await response.json() as { Response?: string; Title?: string; Year?: string; imdbID?: string; Ratings?: Array<{ Source?: string; Value?: string }> };
    if (data.Response !== "True" || !data.Title) return { status: "not_found", title: null, year: null, imdbId: null, ratings: [], retrievedAt: new Date().toISOString() };
    if (!input.imdbId && normalize(data.Title) !== normalize(input.title)) return { status: "not_found", title: null, year: null, imdbId: null, ratings: [], retrievedAt: new Date().toISOString() };
    const sourceMap: Record<string, OmdbRating["source"]> = { "Internet Movie Database": "IMDb", "Rotten Tomatoes": "Rotten Tomatoes", Metacritic: "Metacritic" };
    const ratings = (data.Ratings ?? []).flatMap(item => item.Source && item.Value && sourceMap[item.Source] ? [{ source: sourceMap[item.Source], value: item.Value }] : []);
    return { status: "available", title: data.Title, year: data.Year ?? null, imdbId: data.imdbID ?? input.imdbId ?? null, ratings, retrievedAt: new Date().toISOString() };
  } catch { return { status: "unavailable", title: null, year: null, imdbId: null, ratings: [], retrievedAt: new Date().toISOString() }; }
}
