# Streamwise Data Source Findings

## Validated Availability Data Route

TMDb’s Watch Providers endpoint, supplied through a JustWatch partnership, returns country-specific streaming, rental, and purchase availability by provider. It includes a TMDb landing-page URL rather than individual provider deep links; Streamwise must therefore label all availability as an information service, disclose the last successful retrieval time, and direct users only to lawful destination pages. The TMDb documentation also requires attribution to JustWatch when the provider data is displayed.

Watchmode was evaluated as a possible licensed alternative. Its public documentation page requires interactive access and did not expose a verifiable schema in the available content. It remains a future configurable provider option, not a dependency of the initial release.

## Product Implications

The initial implementation will use TMDb-compatible title and country availability semantics, normalize services into streaming, ad-supported, rental, and purchase groups, preserve the retrieval timestamp, and show a clear freshness/data-coverage notice. Authentication and subscription decisions will remain independent of provider data; the recommendation engine will use only user-entered plan information, user-selected viewing intent, saved titles, normalized availability, and renewal timing.

## Sources

1. TMDb, “Watch Providers,” https://developer.themoviedb.org/reference/movie-watch-providers (validated 2026-08-24).
2. Watchmode, “API Explorer,” https://api.watchmode.com/docs (reviewed 2026-08-24).
