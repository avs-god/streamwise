# Source and Licensing Boundary Research

## Official availability and recommendation sources

TMDb’s official Watch Providers reference states that the provider data is powered by its partnership with JustWatch, supports country/provider availability display, and requires attribution to **JustWatch**; non-compliant use may lose API access. Streamwise therefore uses server-side TMDb watch-provider data only when configured, labels the source as “JustWatch via TMDb,” retains a retrieval timestamp, and does not turn public discussion into legal-offer facts. [1]

TMDb also documents title-level movie recommendations at `GET /movie/{movie_id}/recommendations` with language and page parameters. Streamwise uses this catalog-derived endpoint for post-watch title suggestions, separately from public discussion and only when a catalog credential is configured. [2]

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
