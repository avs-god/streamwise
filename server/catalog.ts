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

export async function searchCatalog(input: {
  query: string;
  language: string;
}): Promise<{ configured: boolean; titles: CatalogTitle[]; checkedAt: string | null }> {
  if (!isCatalogConfigured()) {
    return { configured: false, titles: [], checkedAt: null };
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
  const data = await tmdbFetch<{ results: Result[] }>(
    `/search/multi?query=${encodeURIComponent(input.query)}&include_adult=false&language=${encodeURIComponent(cleanLanguage(input.language))}&page=1`,
  );

  const titles = data.results
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

  return { configured: true, titles, checkedAt: new Date().toISOString() };
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
