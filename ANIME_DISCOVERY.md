# Anime Discovery and Availability Boundaries

Streamwise uses **AniList’s public GraphQL API** for anime discovery metadata, including canonical anime titles, formats, episodes, genres, status, and AniList score. AniList describes its public API as free and publicly accessible, and states that its data team curates entries from credible industry sources.[1] [2] This metadata is labelled as **AniList catalogue data** and is not a legal availability claim.

| Data lane | Source | Permitted presentation | Prohibited presentation |
|---|---|---|---|
| Anime discovery | AniList GraphQL | Anime title, format, genres, episodes, score, season, source page | “Streaming on” or country-specific provider claim |
| Current legal offers | TMDb / JustWatch, Watchmode, Streaming Availability | Country-specific offer type, provider, source link, retrieval time | Replacing an absent offer with anime metadata or web discussion |
| Public-web context | Grounded source links | Clearly labelled reporting, blog, and public discussion reading | Verified availability, alert, tracking, or decision evidence |

AniList requests are server-side GraphQL `POST` calls to `https://graphql.anilist.co`, using a bounded query and no member account access.[2] Jikan was evaluated but is not used as a primary runtime source because its own documentation identifies it as an unofficial MyAnimeList API that scrapes the underlying website.[3]

The existing legal-availability providers remain the only sources that can show country-specific watch offers. Their coverage may include anime titles when those titles have matching TMDb identifiers; an unmapped anime title receives a candid unavailable state rather than a guessed service label.

## References

[1] [AniList API — Introduction](https://docs.anilist.co/guide/introduction)

[2] [AniList API — GraphQL](https://docs.anilist.co/guide/graphql/)

[3] [Jikan REST API v4 documentation](https://docs.api.jikan.moe/)
