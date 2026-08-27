import { getCatalogDetail, isCatalogConfigured, searchCatalog } from "./catalog";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
let rateLimitedUntil = 0;

export type AnimeCatalogTitle = {
  id: number;
  title: string;
  englishTitle: string | null;
  nativeTitle: string | null;
  format: string | null;
  episodes: number | null;
  genres: string[];
  description: string | null;
  coverImage: string | null;
  averageScore: number | null;
  status: string | null;
  startDate: string | null;
  siteUrl: string | null;
};

type AniListMedia = { id?: number; title?: { userPreferred?: string | null; romaji?: string | null; english?: string | null; native?: string | null }; format?: string | null; episodes?: number | null; genres?: string[] | null; description?: string | null; coverImage?: { large?: string | null } | null; averageScore?: number | null; status?: string | null; startDate?: { year?: number | null; month?: number | null; day?: number | null } | null; siteUrl?: string | null };
function normalize(value: string) { return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function toAnimeTitle(media: AniListMedia): AnimeCatalogTitle | null {
  if (!media.id) return null;
  const title = media.title?.userPreferred ?? media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "";
  if (!title) return null;
  const date = media.startDate?.year ? [media.startDate.year, media.startDate.month, media.startDate.day].filter(Boolean).map((part, index) => index ? String(part).padStart(2, "0") : String(part)).join("-") : null;
  return { id: media.id, title, englishTitle: media.title?.english ?? null, nativeTitle: media.title?.native ?? null, format: media.format ?? null, episodes: media.episodes ?? null, genres: Array.isArray(media.genres) ? media.genres.slice(0, 8) : [], description: media.description?.replace(/<[^>]*>/g, "").slice(0, 1200) ?? null, coverImage: media.coverImage?.large ?? null, averageScore: typeof media.averageScore === "number" ? media.averageScore : null, status: media.status ?? null, startDate: date, siteUrl: media.siteUrl ?? null };
}

async function queryAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ query, variables }) });
  if (response.status === 429) { rateLimitedUntil = Date.now() + 60_000; throw new Error("rate_limited"); }
  if (!response.ok) throw new Error(`anilist_${response.status}`);
  const body = await response.json() as { data?: T; errors?: unknown[] };
  if (!body.data || body.errors?.length) throw new Error("anilist_response");
  return body.data;
}

const ANIME_SEARCH_QUERY = `query AnimeSearch($search: String!) { Page(page: 1, perPage: 12) { media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) { id title { userPreferred romaji english native } format episodes genres description(asHtml: false) coverImage { large } averageScore status startDate { year month day } siteUrl } } }`;

/** AniList supplies discovery metadata only; no result is a legal availability assertion. */
export async function searchAnimeCatalog(query: string): Promise<{ status: "available" | "rate_limited" | "unavailable"; titles: AnimeCatalogTitle[]; checkedAt: string | null }> {
  if (rateLimitedUntil > Date.now()) return { status: "rate_limited", titles: [], checkedAt: new Date().toISOString() };
  try {
    const data = await queryAniList<{ Page?: { media?: AniListMedia[] } }>(ANIME_SEARCH_QUERY, { search: query.slice(0, 160) });
    return { status: "available", titles: (data.Page?.media ?? []).flatMap(item => { const title = toAnimeTitle(item); return title ? [title] : []; }), checkedAt: new Date().toISOString() };
  } catch (error) { return { status: error instanceof Error && error.message === "rate_limited" ? "rate_limited" : "unavailable", titles: [], checkedAt: new Date().toISOString() }; }
}

/** Bridges AniList metadata to legal offer providers only after an exact normalised TMDb-title match. */
export async function getAnimeLegalAvailability(input: { title: string; englishTitle: string | null; nativeTitle: string | null; region: string; language: string }) {
  if (!isCatalogConfigured()) return { status: "catalog_not_configured" as const, matchedTitle: null, detail: null };
  const candidates = [input.title, input.englishTitle, input.nativeTitle].filter((value): value is string => Boolean(value?.trim())).filter((value, index, values) => values.findIndex(item => normalize(item) === normalize(value)) === index).slice(0, 3);
  for (const candidate of candidates) {
    const result = await searchCatalog({ query: candidate, language: input.language });
    const match = result.titles.find(title => [title.title, title.originalTitle ?? ""].some(value => normalize(value) === normalize(candidate)));
    if (!match) continue;
    const detail = await getCatalogDetail({ id: match.id, mediaType: match.mediaType, region: input.region, language: input.language });
    if (detail.title) return { status: "matched" as const, matchedTitle: { id: match.id, mediaType: match.mediaType, title: detail.title.title }, detail: detail.title };
  }
  return { status: "no_exact_catalog_match" as const, matchedTitle: null, detail: null };
}

export function setAnimeRateLimitForTests(until: number) { rateLimitedUntil = until; }
