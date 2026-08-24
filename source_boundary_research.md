# Source and Licensing Boundary Research

## Official availability and recommendation sources

TMDb’s official Watch Providers reference states that the provider data is powered by its partnership with JustWatch, supports country/provider availability display, and requires attribution to **JustWatch**; non-compliant use may lose API access. Streamwise therefore uses server-side TMDb watch-provider data only when configured, labels the source as “JustWatch via TMDb,” retains a retrieval timestamp, and does not turn public discussion into legal-offer facts. [1]

TMDb also documents title-level movie recommendations at `GET /movie/{movie_id}/recommendations` with language and page parameters. Streamwise uses this catalog-derived endpoint for post-watch title suggestions, separately from public discussion and only when a catalog credential is configured. [2]

## Major-provider availability integration paths

The current TMDb / JustWatch path remains suitable for the configured catalog boundary because TMDb exposes country-and-provider watch data subject to JustWatch attribution. For higher-volume or richer offer coverage, JustWatch’s own **Content Partner API** is a contracted integration: its documentation says a partner token is issued after a contract, requires branded JustWatch links, and supports provider metadata plus title offers by TMDb, IMDb, or JustWatch ID. This is a licensed partner path, not permission to scrape individual Netflix, Prime Video, Disney+, or other consumer catalog pages. [4]

JustWatch’s streaming-service documentation separately describes feeds supplied **by streaming services** to become integrated in JustWatch. It is not a public developer API for a consumer app to query a provider’s catalog directly. [5]

For an alternative licensed aggregation route, Watchmode documents country-level provider availability, provider links/deep links, daily change endpoints, and commercial plans. Its own documentation also states that it is not affiliated with Netflix, Hulu, Prime Video, Disney+, HBO Max, or other providers; it returns availability and links rather than playback. Movie of the Night’s Streaming Availability API documents a separate commercial aggregation product with country coverage, provider links, price and expiry fields. Both are candidates only after the user supplies credentials and accepts their commercial terms, attribution, and retention requirements. [6] [7]

| Candidate | Integration status for Streamwise | Use permitted by current evidence | Important limit |
|---|---|---|---|
| TMDb Watch Providers / JustWatch | Implemented when `TMDB_ACCESS_TOKEN` is configured | Country-specific provider, subscription, free/ad-supported, rental, and purchase offers with JustWatch attribution | Must label JustWatch and follow TMDb terms |
| JustWatch Content Partner API | Future licensed option | Direct partner-token offers, provider metadata, country paths, and partner links | Requires contract, token, and required branded links |
| Watchmode | Future licensed option | Country-level availability, provider links, deep links, and change data | Aggregator—not an official Netflix/Prime/Disney direct API; plan/attribution terms apply |
| Movie of the Night / Streaming Availability | Future licensed option | Aggregated offers, prices, expiry metadata, and provider links | Requires separate API credentials and commercial-terms review |
| Individual major-provider consumer sites | Not integrated | Outbound user links only | No approved general-purpose consumer availability API is used or inferred; never scrape |

## Ratings and review references

IMDb’s official content-licensing information says that ratings and other metadata are available through customized licensing packages. Without such a configured license, Streamwise provides outbound IMDb references only and does not reproduce IMDb numerical ratings or protected review content. [3]

| Surface | Permitted current behavior | Deliberately excluded without a separate license |
|---|---|---|
| Country-specific offers | TMDb / JustWatch data with attribution, timestamp, and outbound provider-source link | Claims based on forums, social posts, or scraped pages |
| Related and post-watch titles | TMDb’s catalog recommendation and similar-title endpoints | Community activity as a hidden recommendation input |
| IMDb | Outbound title-search reference | Displaying IMDb ratings or review text |
| Rotten Tomatoes | Outbound title-search reference | Displaying scores or copied reviews without permission |

## References

[1]: https://developer.themoviedb.org/reference/movie-watch-providers "TMDb: Watch Providers"
[2]: https://developer.themoviedb.org/reference/movie-recommendations "TMDb: Movie Recommendations"
[3]: https://help.imdb.com/article/imdb/general-information/content-licensing/GZGA5HDQ8NE97LVR "IMDb Content Licensing"
[4]: https://apis.justwatch.com/docs/api/ "JustWatch Content Partner API"
[5]: https://apis.justwatch.com/docs/streaming_service/ "JustWatch Streaming Service Integration"
[6]: https://api.watchmode.com/ "Watchmode Streaming Availability API"
[7]: https://www.movieofthenight.com/about/api "Streaming Availability API"
