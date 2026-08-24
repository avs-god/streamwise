import { invokeLLM, listLLMModels } from "./_core/llm";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type OfferType = "stream" | "ads" | "free" | "rent" | "buy";

export type CatalogProvider = {
  id: number;
  name: string;
  logoPath: string | null;
  type: OfferType;
};

export type CatalogTitle = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string | null;
  overview: string | null;
  posterPath: string | null;
  releaseDate: string | null;
};

export type CatalogDetail = CatalogTitle & {
  runtime: number | null;
  genres: string[];
  providerPageUrl: string | null;
  offers: CatalogProvider[];
  checkedAt: string;
};

function getAccessToken() {
  return process.env.TMDB_ACCESS_TOKEN?.trim() ?? "";
}

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
  const data = await tmdbFetch<DetailResponse>(
    `/${input.mediaType}/${input.id}?append_to_response=watch%2Fproviders&language=${encodeURIComponent(cleanLanguage(input.language))}`,
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
      return [{ id: provider.provider_id, name: provider.provider_name, logoPath: provider.logo_path ?? null, type }];
    }),
  );

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
      checkedAt: new Date().toISOString(),
    },
  };
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
