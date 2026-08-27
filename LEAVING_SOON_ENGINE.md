# Leaving Soon Engine

Streamwise runs its existing daily opt-in refresh as a durable scheduled request. It does not use an in-process timer. The engine has three distinct evidence lanes:

| Lane | Source | What it can display |
|---|---|---|
| Provider expiry | Streaming Availability change feed | A provider-labelled “Leaving soon from [provider]” status when an `expiring` record matches the title and country. |
| Observed departure | Consecutive legal country snapshots | A time-bounded observed provider-removal status; it is not an announced departure date. |
| Public-web context | Member-triggered grounded research | Source-linked reporting and discussion context, never a legal status, card badge, snapshot, or alert by itself. |

The Streaming Availability API documents `GET /changes` for `expiring` changes, with required country, change type, and item type parameters. It returns changes separately from affected shows and supports future date windows, catalog filters, show type, pagination, and explicit handling for unknown dates.[1]

The matching Show object documents `tmdbId` in `movie/<id>` or `tv/<id>` form and its `showType`; the engine uses those two fields to map an expiring change safely to a stored title.[2] It preserves the provider, country, exact expiry time where supplied, source link, and retrieval time. It does not infer departure dates from social posts, discussion, or an absent catalog record.

## Separate theatrical and announced-streaming indicators

| Indicator | Source | What Streamwise can display | What it cannot imply |
|---|---|---|---|
| Current theatrical listing | TMDb regional `movie/now_playing` result | “In theatres in [country]” only while the movie is included in TMDb’s current regional list | A streaming offer, a historical release date, or confirmed local showtimes |
| Announced OTT date | Streaming Availability `upcoming` change with an exact timestamp | Provider-labelled future date, country, source link, and retrieval time | A current legal offer, a provider guarantee, or a date inferred from public-web context |

TMDb describes its `movie/now_playing` endpoint as a list of movies currently in theatres and accepts an ISO-3166-1 regional filter.[3] A generic past or future release date cannot activate the label. Streaming Availability documents `upcoming` as a future change type and indicates that a future timestamp is supplied only where the exact date is known; only those exact-dated records are persisted for explicitly tracked titles.[1]

## Reference

[1] [Streaming Availability API — Changes](https://docs.movieofthenight.com/resource/changes)

[2] [Streaming Availability API — Shows](https://docs.movieofthenight.com/resource/shows)

[3] [TMDb API — Now Playing](https://developer.themoviedb.org/reference/movie-now-playing-list)
