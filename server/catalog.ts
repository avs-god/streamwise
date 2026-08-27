import { invokeLLM, listLLMModels } from "./_core/llm";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
let catalogTokenTestOverride: string | null = null;
let streamingAvailabilityKeyTestOverride: string | undefined;
let streamingAvailabilityRateLimitedUntil = 0;

export type OfferType = "stream" | "ads" | "free" | "rent" | "buy";

export type CatalogProvider = {
  id: number;
  name: string;
  logoPath: string | null;
  type: OfferType;
  source: "TMDb / JustWatch" | "Watchmode" | "Streaming Availability by Movie of the Night";
  webUrl: string | null;
  price?: string | null;
  detail?: string | null;
};

export type CatalogTitle = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string | null;
  overview: string | null;
  posterPath: string | null;
  releaseDate: string | null;
  tmdbVoteAverage?: number | null;
  tmdbVoteCount?: number | null;
};

export type CatalogDetail = CatalogTitle & {
  runtime: number | null;
  genres: string[];
  providerPageUrl: string | null;
  offers: CatalogProvider[];
  watchmodeOffers: CatalogProvider[];
  watchmodeStatus: "available" | "unavailable" | "not_configured";
  watchmodeCheckedAt: string | null;
  streamingAvailabilityOffers: CatalogProvider[];
  streamingAvailabilityStatus: "available" | "unavailable" | "not_configured";
  streamingAvailabilityCheckedAt: string | null;
  checkedAt: string;
  tmdbVoteAverage: number | null;
  tmdbVoteCount: number | null;
  imdbId: string | null;
};

export type TmdbReview = { author: string; content: string; url: string | null; createdAt: string | null; rating: number | null };

function getAccessToken() {
  return catalogTokenTestOverride ?? process.env.TMDB_ACCESS_TOKEN?.trim() ?? "";
}

/** Test-only seam retaining deterministic no-token contract coverage with a configured live catalog. */
export function setCatalogAccessTokenForTests(token: string | null) { catalogTokenTestOverride = token; }

export function isCatalogConfigured() {
  return Boolean(getAccessToken());
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Live catalog is not configured.");
  }

  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Catalog provider returned ${response.status}.`);
  }

  return (await response.json()) as T;
}

function cleanLanguage(language: string) {
  return /^[a-z]{2}(?:-[A-Z]{2})?$/.test(language) ? language : "en-US";
}

function cleanRegion(region: string) {
  return /^[A-Z]{2}$/.test(region) ? region : "US";
}

function getWatchmodeKey() { return process.env.WATCHMODE_API_KEY?.trim() ?? ""; }
function getStreamingAvailabilityKey() { return streamingAvailabilityKeyTestOverride !== undefined ? streamingAvailabilityKeyTestOverride : (process.env.VITEST ? "" : process.env.RAPIDAPI_STREAMING_AVAILABILITY_KEY?.trim() ?? ""); }
export function setStreamingAvailabilityKeyForTests(key: string | undefined) { streamingAvailabilityKeyTestOverride = key; streamingAvailabilityRateLimitedUntil = 0; }

export type StreamingAvailabilityExpiry = { tmdbId: number; mediaType: "movie" | "tv"; title: string; providerName: string; providerType: string; expiresAt: Date; sourceUrl: string | null };
export type StreamingAvailabilityUpcoming = { tmdbId: number; mediaType: "movie" | "tv"; title: string; providerName: string; providerType: string; announcedFor: Date; sourceUrl: string | null };

function parseStreamingAvailabilityExpiry(payload: unknown): StreamingAvailabilityExpiry[] {
  const data = payload as { changes?: Array<{ showId?: string | number; showType?: string; tmdbId?: string; service?: { id?: string; name?: string } | string; streamingOptionType?: string; timestamp?: number; link?: string | null }>; shows?: Array<{ id?: string | number; showId?: string | number; tmdbId?: string; title?: string; showType?: string }> | Record<string, { id?: string | number; showId?: string | number; tmdbId?: string; title?: string; showType?: string }> };
  const shows = Array.isArray(data.shows) ? data.shows : Object.values(data.shows ?? {});
  const showById = new Map(shows.map(show => [String(show.id ?? show.showId ?? ""), show]));
  return (data.changes ?? []).flatMap(change => {
    const show = showById.get(String(change.showId ?? ""));
    const tmdbRef = show?.tmdbId ?? change.tmdbId;
    const match = typeof tmdbRef === "string" ? /^(movie|tv)\/(\d+)$/.exec(tmdbRef) : null;
    const mediaType = (show?.showType ?? change.showType) === "movie" ? "movie" : (show?.showType ?? change.showType) === "series" || (show?.showType ?? change.showType) === "tv" ? "tv" : null;
    const providerName = typeof change.service === "string" ? change.service : change.service?.name ?? change.service?.id;
    if (!match || !mediaType || !providerName || !change.timestamp || !Number.isFinite(change.timestamp)) return [];
    return [{ tmdbId: Number(match[2]), mediaType: match[1] === "movie" ? "movie" : "tv", title: show?.title?.slice(0, 500) ?? `TMDb ${match[2]}`, providerName: providerName.slice(0, 150), providerType: change.streamingOptionType?.slice(0, 24) ?? "subscription", expiresAt: new Date(change.timestamp * 1000), sourceUrl: change.link ?? null }];
  });
}

/** Fetches only the provider’s documented expiring change window; caller persists matching records and handles rate limits. */
export async function getStreamingAvailabilityExpiryChanges(region: string): Promise<{ status: "available" | "not_configured" | "rate_limited" | "unavailable"; entries: StreamingAvailabilityExpiry[]; checkedAt: Date | null; retryAfterMs: number | null }> {
  const key = getStreamingAvailabilityKey();
  if (!key) return { status: "not_configured", entries: [], checkedAt: null, retryAfterMs: null };
  const now = Date.now();
  if (streamingAvailabilityRateLimitedUntil > now) return { status: "rate_limited", entries: [], checkedAt: new Date(now), retryAfterMs: streamingAvailabilityRateLimitedUntil - now };
  const from = Math.floor(now / 1000); const to = Math.floor((now + 31 * 24 * 60 * 60 * 1000) / 1000);
  const query = new URLSearchParams({ country: cleanRegion(region).toLowerCase(), change_type: "expiring", item_type: "show", from: String(from), to: String(to), include_unknown_dates: "false", order_direction: "asc", output_language: "en" });
  try {
    const response = await fetch(`https://streaming-availability.p.rapidapi.com/changes?${query.toString()}`, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "streaming-availability.p.rapidapi.com" } });
    const checkedAt = new Date();
    if (response.status === 429) {
      const retrySeconds = Math.max(60, Math.min(Number(response.headers.get("retry-after")) || 1800, 24 * 60 * 60));
      streamingAvailabilityRateLimitedUntil = now + retrySeconds * 1000;
      return { status: "rate_limited", entries: [], checkedAt, retryAfterMs: retrySeconds * 1000 };
    }
    if (!response.ok) return { status: "unavailable", entries: [], checkedAt, retryAfterMs: null };
    return { status: "available", entries: parseStreamingAvailabilityExpiry(await response.json()), checkedAt, retryAfterMs: null };
  } catch { return { status: "unavailable", entries: [], checkedAt: new Date(), retryAfterMs: null }; }
}

/** Fetches only documented future `upcoming` change records with a known exact date. It never implies a current legal offer. */
export async function getStreamingAvailabilityUpcomingChanges(region: string): Promise<{ status: "available" | "not_configured" | "rate_limited" | "unavailable"; entries: StreamingAvailabilityUpcoming[]; checkedAt: Date | null; retryAfterMs: number | null }> {
  const key = getStreamingAvailabilityKey();
  if (!key) return { status: "not_configured", entries: [], checkedAt: null, retryAfterMs: null };
  const now = Date.now();
  if (streamingAvailabilityRateLimitedUntil > now) return { status: "rate_limited", entries: [], checkedAt: new Date(now), retryAfterMs: streamingAvailabilityRateLimitedUntil - now };
  const from = Math.floor(now / 1000); const to = Math.floor((now + 31 * 24 * 60 * 60 * 1000) / 1000);
  const query = new URLSearchParams({ country: cleanRegion(region).toLowerCase(), change_type: "upcoming", item_type: "show", from: String(from), to: String(to), include_unknown_dates: "false", order_direction: "asc", output_language: "en" });
  try {
    const response = await fetch(`https://streaming-availability.p.rapidapi.com/changes?${query.toString()}`, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "streaming-availability.p.rapidapi.com" } });
    const checkedAt = new Date();
    if (response.status === 429) {
      const retrySeconds = Math.max(60, Math.min(Number(response.headers.get("retry-after")) || 1800, 24 * 60 * 60));
      streamingAvailabilityRateLimitedUntil = now + retrySeconds * 1000;
      return { status: "rate_limited", entries: [], checkedAt, retryAfterMs: retrySeconds * 1000 };
    }
    if (!response.ok) return { status: "unavailable", entries: [], checkedAt, retryAfterMs: null };
    const payload = await response.json() as { changes?: Array<{ showId?: string | number; showType?: string; tmdbId?: string; service?: { id?: string; name?: string } | string; streamingOptionType?: string; timestamp?: number; link?: string | null }>; shows?: Array<{ id?: string | number; showId?: string | number; tmdbId?: string; title?: string; showType?: string }> | Record<string, { id?: string | number; showId?: string | number; tmdbId?: string; title?: string; showType?: string }> };
    const shows = Array.isArray(payload.shows) ? payload.shows : Object.values(payload.shows ?? {}); const showById = new Map(shows.map(show => [String(show.id ?? show.showId ?? ""), show]));
    const entries = (payload.changes ?? []).flatMap(change => {
      const show = showById.get(String(change.showId ?? "")); const tmdbRef = show?.tmdbId ?? change.tmdbId; const match = typeof tmdbRef === "string" ? /^(movie|tv)\/(\d+)$/.exec(tmdbRef) : null;
      const mediaType = (show?.showType ?? change.showType) === "movie" ? "movie" : (show?.showType ?? change.showType) === "series" || (show?.showType ?? change.showType) === "tv" ? "tv" : null;
      const providerName = typeof change.service === "string" ? change.service : change.service?.name ?? change.service?.id;
      if (!match || !mediaType || !providerName || !change.timestamp || !Number.isFinite(change.timestamp)) return [];
      return [{ tmdbId: Number(match[2]), mediaType: (match[1] === "movie" ? "movie" : "tv") as "movie" | "tv", title: show?.title?.slice(0, 500) ?? `TMDb ${match[2]}`, providerName: providerName.slice(0, 150), providerType: change.streamingOptionType?.slice(0, 24) ?? "subscription", announcedFor: new Date(change.timestamp * 1000), sourceUrl: change.link ?? null }];
    });
    return { status: "available", entries, checkedAt, retryAfterMs: null };
  } catch { return { status: "unavailable", entries: [], checkedAt: new Date(), retryAfterMs: null }; }
}

async function getWatchmodeOffers(input: { tmdbId: number; mediaType: "movie" | "tv"; region: string }) {
  const apiKey = getWatchmodeKey();
  if (!apiKey) return { offers: [] as CatalogProvider[], status: "not_configured" as const, checkedAt: null };
  try {
    const field = input.mediaType === "movie" ? "tmdb_movie_id" : "tmdb_tv_id";
    const lookup = await fetch(`https://api.watchmode.com/v1/search/?search_field=${field}&search_value=${input.tmdbId}&apiKey=${encodeURIComponent(apiKey)}`);
    if (!lookup.ok) return { offers: [] as CatalogProvider[], status: "unavailable" as const, checkedAt: new Date().toISOString() };
    const mapped = await lookup.json() as { title_results?: Array<{ id?: number }> };
    const watchmodeId = mapped.title_results?.[0]?.id;
    if (!watchmodeId) return { offers: [] as CatalogProvider[], status: "unavailable" as const, checkedAt: new Date().toISOString() };
    const sources = await fetch(`https://api.watchmode.com/v1/title/${watchmodeId}/sources/?apiKey=${encodeURIComponent(apiKey)}&regions=${cleanRegion(input.region)}`);
    if (!sources.ok) return { offers: [] as CatalogProvider[], status: "unavailable" as const, checkedAt: new Date().toISOString() };
    const data = await sources.json() as Array<{ source_id?: number; name?: string; type?: string; region?: string; web_url?: string | null; format?: string | null }>;
    const typeMap: Record<string, OfferType> = { sub: "stream", free: "free", rent: "rent", buy: "buy", purchase: "buy", tv: "ads" };
    const offers = data.filter(item => item.region === cleanRegion(input.region) && item.source_id && item.name && item.type && typeMap[item.type]).map(item => ({ id: item.source_id!, name: item.name!, logoPath: null, type: typeMap[item.type!], source: "Watchmode" as const, webUrl: item.web_url ?? null, detail: item.format ?? null }));
    return { offers, status: "available" as const, checkedAt: new Date().toISOString() };
  } catch { return { offers: [] as CatalogProvider[], status: "unavailable" as const, checkedAt: new Date().toISOString() }; }
}

async function getStreamingAvailabilityOffers(input: { tmdbId: number; mediaType: "movie" | "tv"; region: string }) {
  const apiKey = getStreamingAvailabilityKey();
  if (!apiKey) return { offers: [] as CatalogProvider[], status: "not_configured" as const, checkedAt: null };
  try {
    const tmdbRef = `${input.mediaType === "movie" ? "movie" : "tv"}/${input.tmdbId}`;
    const response = await fetch(`https://streaming-availability.p.rapidapi.com/shows/${encodeURIComponent(tmdbRef)}?country=${cleanRegion(input.region).toLowerCase()}`, { headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": "streaming-availability.p.rapidapi.com" } });
    if (!response.ok) return { offers: [] as CatalogProvider[], status: "unavailable" as const, checkedAt: new Date().toISOString() };
    const data = await response.json() as { streamingOptions?: Record<string, Array<{ service?: { name?: string }; type?: string; link?: string | null; price?: { formatted?: string | null } | null }>> };
    const typeMap: Record<string, OfferType> = { subscription: "stream", free: "free", rent: "rent", buy: "buy", addon: "stream" };
    const offers = (data.streamingOptions?.[cleanRegion(input.region).toLowerCase()] ?? []).flatMap((item, index) => item.service?.name && item.type && typeMap[item.type] ? [{ id: -(index + 1), name: item.service.name, logoPath: null, type: typeMap[item.type], source: "Streaming Availability by Movie of the Night" as const, webUrl: item.link ?? null, price: item.price?.formatted ?? null }] : []);
    return { offers, status: "available" as const, checkedAt: new Date().toISOString() };
  } catch { return { offers: [] as CatalogProvider[], status: "unavailable" as const, checkedAt: new Date().toISOString() }; }
}

export function parseTitleSuggestion(content: unknown, originalQuery: string): string | null {
  try {
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content) as { query?: unknown };
    const suggestion = typeof parsed.query === "string" ? parsed.query.trim().replace(/\s+/g, " ") : "";
    if (!suggestion || suggestion.length < 2 || suggestion.length > 120 || suggestion.toLocaleLowerCase() === originalQuery.trim().toLocaleLowerCase()) return null;
    return suggestion;
  } catch { return null; }
}

async function suggestTitleQuery(query: string) {
  try {
    const models = await listLLMModels();
    const model = models.data.find(item => item.id === "gpt-5-mini")?.id;
    if (!model) return null;
    const response = await invokeLLM({
      model, maxCompletionTokens: 80,
      messages: [{ role: "system", content: "Correct a likely movie or television title spelling only. Do not identify availability, release year, or any streaming service. If uncertain, return the original query. Output JSON only." }, { role: "user", content: query }],
      outputSchema: { name: "title_query", strict: true, schema: { type: "object", properties: { query: { type: "string", minLength: 2, maxLength: 120 } }, required: ["query"], additionalProperties: false } },
    });
    return parseTitleSuggestion(response.choices[0]?.message.content, query);
  } catch { return null; }
}

export async function searchCatalog(input: {
  query: string;
  language: string;
}): Promise<{ configured: boolean; titles: CatalogTitle[]; checkedAt: string | null; correctedQuery: string | null }> {
  if (!isCatalogConfigured()) {
    return { configured: false, titles: [], checkedAt: null, correctedQuery: null };
  }

  type Result = {
    id: number;
    media_type: string;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
  };
  const mapResults = (results: Result[]) => results
    .filter(item => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 12)
    .map(item => ({
      id: item.id,
      mediaType: item.media_type as "movie" | "tv",
      title: item.title ?? item.name ?? "Untitled",
      originalTitle: item.original_title ?? item.original_name ?? null,
      overview: item.overview ?? null,
      posterPath: item.poster_path ?? null,
      releaseDate: item.release_date ?? item.first_air_date ?? null,
    }));
  const runSearch = async (query: string) => mapResults((await tmdbFetch<{ results: Result[] }>(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=${encodeURIComponent(cleanLanguage(input.language))}&page=1`)).results);
  let titles = await runSearch(input.query);
  let correctedQuery: string | null = null;
  if (!titles.length) {
    const suggestion = await suggestTitleQuery(input.query);
    if (suggestion) {
      const corrected = await runSearch(suggestion);
      if (corrected.length) { titles = corrected; correctedQuery = suggestion; }
    }
  }

  return { configured: true, titles, checkedAt: new Date().toISOString(), correctedQuery };
}

export async function getCatalogDetail(input: {
  id: number;
  mediaType: "movie" | "tv";
  region: string;
  language: string;
}): Promise<{ configured: boolean; title: CatalogDetail | null }> {
  if (!isCatalogConfigured()) {
    return { configured: false, title: null };
  }

  type ProviderEntry = {
    provider_id: number;
    provider_name: string;
    logo_path?: string | null;
  };
  type DetailResponse = {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    runtime?: number | null;
    episode_run_time?: number[];
    genres?: { name: string }[];
    vote_average?: number;
    vote_count?: number;
    external_ids?: { imdb_id?: string | null };
    "watch/providers"?: {
      results?: Record<
        string,
        {
          link?: string;
          flatrate?: ProviderEntry[];
          ads?: ProviderEntry[];
          free?: ProviderEntry[];
          rent?: ProviderEntry[];
          buy?: ProviderEntry[];
        }
      >;
    };
  };
  const watchmodePromise = getWatchmodeOffers({ tmdbId: input.id, mediaType: input.mediaType, region: input.region });
  const streamingAvailabilityPromise = getStreamingAvailabilityOffers({ tmdbId: input.id, mediaType: input.mediaType, region: input.region });
  const data = await tmdbFetch<DetailResponse>(
    `/${input.mediaType}/${input.id}?append_to_response=watch%2Fproviders%2Cexternal_ids&language=${encodeURIComponent(cleanLanguage(input.language))}`,
  );
  const regionalOffers = data["watch/providers"]?.results?.[cleanRegion(input.region)];
  const offerGroups: Array<[OfferType, ProviderEntry[] | undefined]> = [
    ["stream", regionalOffers?.flatrate],
    ["ads", regionalOffers?.ads],
    ["free", regionalOffers?.free],
    ["rent", regionalOffers?.rent],
    ["buy", regionalOffers?.buy],
  ];
  const seen = new Set<string>();
  const offers = offerGroups.flatMap(([type, providers]) =>
    (providers ?? []).flatMap(provider => {
      const key = `${type}:${provider.provider_id}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ id: provider.provider_id, name: provider.provider_name, logoPath: provider.logo_path ?? null, type, source: "TMDb / JustWatch" as const, webUrl: regionalOffers?.link ?? null }];
    }),
  );
  const watchmode = await watchmodePromise;
  const streamingAvailability = await streamingAvailabilityPromise;

  return {
    configured: true,
    title: {
      id: data.id,
      mediaType: input.mediaType,
      title: data.title ?? data.name ?? "Untitled",
      originalTitle: data.original_title ?? data.original_name ?? null,
      overview: data.overview ?? null,
      posterPath: data.poster_path ?? null,
      releaseDate: data.release_date ?? data.first_air_date ?? null,
      runtime: data.runtime ?? data.episode_run_time?.[0] ?? null,
      genres: data.genres?.map(genre => genre.name) ?? [],
      providerPageUrl: regionalOffers?.link ?? null,
      offers,
      watchmodeOffers: watchmode.offers,
      watchmodeStatus: watchmode.status,
      watchmodeCheckedAt: watchmode.checkedAt,
      streamingAvailabilityOffers: streamingAvailability.offers,
      streamingAvailabilityStatus: streamingAvailability.status,
      streamingAvailabilityCheckedAt: streamingAvailability.checkedAt,
      checkedAt: new Date().toISOString(),
      tmdbVoteAverage: typeof data.vote_average === "number" ? data.vote_average : null,
      tmdbVoteCount: typeof data.vote_count === "number" ? data.vote_count : null,
      imdbId: data.external_ids?.imdb_id ?? null,
    },
  };
}

/** TMDb-supplied user reviews, deliberately kept distinct from Streamwise member reviews and external critic links. */
export async function getTmdbReviews(input: { id: number; mediaType: "movie" | "tv"; language: string }): Promise<{ configured: boolean; reviews: TmdbReview[]; checkedAt: string | null }> {
  if (!isCatalogConfigured()) return { configured: false, reviews: [], checkedAt: null };
  type Response = { results?: Array<{ author?: string; content?: string; url?: string | null; created_at?: string | null; author_details?: { rating?: number | null } }> };
  try {
    const data = await tmdbFetch<Response>(`/${input.mediaType}/${input.id}/reviews?language=${encodeURIComponent(cleanLanguage(input.language))}&page=1`);
    const reviews = (data.results ?? []).flatMap(review => review.author && review.content ? [{ author: review.author.slice(0, 120), content: review.content.slice(0, 1600), url: review.url ?? null, createdAt: review.created_at ?? null, rating: typeof review.author_details?.rating === "number" ? review.author_details.rating : null }] : []).slice(0, 3);
    return { configured: true, reviews, checkedAt: new Date().toISOString() };
  } catch { return { configured: true, reviews: [], checkedAt: new Date().toISOString() }; }
}

type TheatricalStatus = { configured: boolean; status: "listed" | "not_listed" | "not_applicable" | "unavailable" | "not_configured"; sourceUrl: string | null; checkedAt: string | null };
const nowPlayingCache = new Map<string, { expiresAt: number; resultIds: Set<number>; checkedAt: string }>();

/** Checks TMDb's documented region-scoped current-theatrical list. A past release date alone never produces this signal. */
export async function getCurrentTheatricalStatus(input: { id: number; mediaType: "movie" | "tv"; region: string; language: string }): Promise<TheatricalStatus> {
  if (input.mediaType !== "movie") return { configured: isCatalogConfigured(), status: "not_applicable", sourceUrl: null, checkedAt: null };
  if (!isCatalogConfigured()) return { configured: false, status: "not_configured", sourceUrl: null, checkedAt: null };
  const key = `${cleanRegion(input.region)}:${cleanLanguage(input.language)}`; const cached = nowPlayingCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return { configured: true, status: cached.resultIds.has(input.id) ? "listed" : "not_listed", sourceUrl: `https://www.themoviedb.org/movie/${input.id}`, checkedAt: cached.checkedAt };
  try {
    const response = await tmdbFetch<{ results?: Array<{ id?: number }> }>(`/movie/now_playing?language=${encodeURIComponent(cleanLanguage(input.language))}&region=${encodeURIComponent(cleanRegion(input.region))}&page=1`);
    const checkedAt = new Date().toISOString(); const resultIds = new Set((response.results ?? []).flatMap(result => typeof result.id === "number" ? [result.id] : []));
    nowPlayingCache.set(key, { expiresAt: Date.now() + 15 * 60_000, resultIds, checkedAt });
    return { configured: true, status: resultIds.has(input.id) ? "listed" : "not_listed", sourceUrl: `https://www.themoviedb.org/movie/${input.id}`, checkedAt };
  } catch { return { configured: true, status: "unavailable", sourceUrl: null, checkedAt: new Date().toISOString() }; }
}

export type DiscoveryMode = "popular" | "top_rated" | "genre";

export async function discoverCatalog(input: { mode: DiscoveryMode; mediaType: "movie" | "tv" | "all"; region: string; language: string; genreId?: number }): Promise<{ configured: boolean; titles: CatalogTitle[]; checkedAt: string | null; explanation: string }> {
  if (!isCatalogConfigured()) return { configured: false, titles: [], checkedAt: null, explanation: "Live catalog discovery is not configured, so Streamwise will not invent recommendations or provider offers." };
  type Result = { id: number; title?: string; name?: string; original_title?: string; original_name?: string; overview?: string; poster_path?: string | null; release_date?: string; first_air_date?: string };
  const mediaTypes = input.mediaType === "all" ? ["movie", "tv"] as const : [input.mediaType] as const;
  const sortBy = input.mode === "top_rated" ? "vote_average.desc" : "popularity.desc";
  const pages = await Promise.all(mediaTypes.map(async mediaType => {
    const query = new URLSearchParams({ include_adult: "false", include_video: "false", language: cleanLanguage(input.language), page: "1", watch_region: cleanRegion(input.region), sort_by: sortBy });
    if (input.mode === "top_rated") query.set("vote_count.gte", "200");
    if (input.mode === "genre" && input.genreId) query.set("with_genres", String(input.genreId));
    const result = await tmdbFetch<{ results?: Result[] }>(`/discover/${mediaType}?${query.toString()}`);
    return (result.results ?? []).map(item => ({ id: item.id, mediaType, title: item.title ?? item.name ?? "Untitled", originalTitle: item.original_title ?? item.original_name ?? null, overview: item.overview ?? null, posterPath: item.poster_path ?? null, releaseDate: item.release_date ?? item.first_air_date ?? null }));
  }));
  const explanation = input.mode === "popular" ? "Catalog popularity ranking. Provider availability must be opened per title for the selected country." : input.mode === "top_rated" ? "Catalog rating ranking with a minimum vote count. Provider availability must be opened per title for the selected country." : "Catalog genre ranking. Provider availability must be opened per title for the selected country.";
  return { configured: true, titles: pages.flat().slice(0, 16), checkedAt: new Date().toISOString(), explanation };
}

export async function getSimilarCatalogTitles(input: { id: number; mediaType: "movie" | "tv"; language: string }): Promise<{ configured: boolean; titles: CatalogTitle[] }> {
  if (!isCatalogConfigured()) return { configured: false, titles: [] };
  type Result = { id: number; title?: string; name?: string; original_title?: string; original_name?: string; overview?: string; poster_path?: string | null; release_date?: string; first_air_date?: string };
  const data = await tmdbFetch<{ results?: Result[] }>(`/${input.mediaType}/${input.id}/similar?language=${encodeURIComponent(cleanLanguage(input.language))}&page=1`);
  return { configured: true, titles: (data.results ?? []).slice(0, 8).map(item => ({ id: item.id, mediaType: input.mediaType, title: item.title ?? item.name ?? "Untitled", originalTitle: item.original_title ?? item.original_name ?? null, overview: item.overview ?? null, posterPath: item.poster_path ?? null, releaseDate: item.release_date ?? item.first_air_date ?? null })) };
}

/** Catalog-related picks from TMDb's official title recommendations endpoint; never inferred from community activity. */
export async function getRecommendedCatalogTitles(input: { id: number; mediaType: "movie" | "tv"; language: string }): Promise<{ configured: boolean; titles: CatalogTitle[] }> {
  if (!isCatalogConfigured()) return { configured: false, titles: [] };
  type Result = { id: number; title?: string; name?: string; original_title?: string; original_name?: string; overview?: string; poster_path?: string | null; release_date?: string; first_air_date?: string };
  const data = await tmdbFetch<{ results?: Result[] }>(`/${input.mediaType}/${input.id}/recommendations?language=${encodeURIComponent(cleanLanguage(input.language))}&page=1`);
  return { configured: true, titles: (data.results ?? []).slice(0, 8).map(item => ({ id: item.id, mediaType: input.mediaType, title: item.title ?? item.name ?? "Untitled", originalTitle: item.original_title ?? item.original_name ?? null, overview: item.overview ?? null, posterPath: item.poster_path ?? null, releaseDate: item.release_date ?? item.first_air_date ?? null })) };
}

export type RecommendationCatalogIntent = {
  query: string;
  referenceTitle: string | null;
  genreId: number | null;
  mediaType: "movie" | "tv" | "all";
  originalLanguage: string | null;
  maxRuntimeMinutes: number | null;
};

/** Catalog-only recommendation retrieval for an AI-interpreted taste prompt. */
export async function recommendCatalogFromIntent(intent: RecommendationCatalogIntent, language: string): Promise<{ configured: boolean; titles: CatalogTitle[]; explanation: string }> {
  if (!isCatalogConfigured()) return { configured: false, titles: [], explanation: "Live catalog recommendations are not configured, so Streamwise will not invent suggestions." };
  const types = intent.mediaType === "all" ? ["movie", "tv"] as const : [intent.mediaType] as const;
  const seen = new Set<number>();
  const addUnique = (titles: CatalogTitle[]) => titles.filter(title => !seen.has(title.id) && (seen.add(title.id), true));
  const reference = intent.referenceTitle ? await searchCatalog({ query: intent.referenceTitle, language }) : null;
  const matched = reference?.titles.find(title => intent.mediaType === "all" || title.mediaType === intent.mediaType) ?? reference?.titles[0];
  if (matched) {
    const related = await getRecommendedCatalogTitles({ id: matched.id, mediaType: matched.mediaType, language });
    const titles = addUnique(related.titles).slice(0, 12);
    if (titles.length) return { configured: true, titles, explanation: `Catalog recommendations related to ${matched.title}.` };
  }
  type Result = { id: number; title?: string; name?: string; original_title?: string; original_name?: string; overview?: string; poster_path?: string | null; release_date?: string; first_air_date?: string };
  const pages = await Promise.all(types.map(async mediaType => {
    const query = new URLSearchParams({ include_adult: "false", include_video: "false", language: cleanLanguage(language), page: "1", sort_by: "popularity.desc" });
    if (intent.genreId) query.set("with_genres", String(intent.genreId));
    if (intent.originalLanguage && /^[a-z]{2}$/.test(intent.originalLanguage)) query.set("with_original_language", intent.originalLanguage);
    if (mediaType === "movie" && intent.maxRuntimeMinutes) query.set("with_runtime.lte", String(intent.maxRuntimeMinutes));
    const data = await tmdbFetch<{ results?: Result[] }>(`/discover/${mediaType}?${query.toString()}`);
    return (data.results ?? []).map(item => ({ id: item.id, mediaType, title: item.title ?? item.name ?? "Untitled", originalTitle: item.original_title ?? item.original_name ?? null, overview: item.overview ?? null, posterPath: item.poster_path ?? null, releaseDate: item.release_date ?? item.first_air_date ?? null }));
  }));
  const titles = addUnique(pages.flat()).slice(0, 12);
  return { configured: true, titles, explanation: intent.genreId || intent.originalLanguage ? "Catalog results matching the requested genre or original-language preference." : "Catalog popular results used because the prompt did not resolve to a specific title or genre filter." };
}

/** Stable post-watch merge: signal order determines priority; already-recorded titles and duplicates are excluded. */
export function mergePostWatchRecommendations(sources: Array<{ sourceId: number; titles: CatalogTitle[] }>, excludedIds: number[]) {
  const excluded = new Set(excludedIds);
  const seen = new Set<number>();
  return sources.flatMap(source => source.titles.filter(title => !excluded.has(title.id) && !seen.has(title.id) && (seen.add(title.id), true))).slice(0, 16);
}
