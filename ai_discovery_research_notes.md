# AI Discovery Research Notes

## Product boundaries

Streamwise must treat a country-specific legal-offer API as the **only source of availability fact**. A title’s provider, rental, purchase, advertising-supported, or free-offer status is therefore verified only when returned by the configured catalog source with a retrieval timestamp and a provider/source URL.

Public-web material may be searched only to surface a **clearly labeled lead** about a possible platform change, service announcement, or consumer-reported issue. A lead cannot modify the verified-offer snapshot, trigger a “leaving soon” assertion, or produce a keep/pause/cancel recommendation. The user must be able to inspect its source URL, outlet/domain, and retrieval timestamp.

## Source findings

Movie of the Night’s Streaming Availability API publicly describes support for streaming metadata including deep links and expiry dates, as well as regional services and country/service coverage. This establishes that a licensed availability provider with date fields is a preferable future source for confirmed change signals, subject to its commercial terms and required attribution. [1]

Reddit’s data terms state that use of its data APIs is governed by separate API terms and developer requirements. Accordingly, Streamwise will not scrape Reddit pages, collect account identifiers, or display posts/comments. Any future Reddit integration must use an approved API arrangement and will be presented only as an unverified discussion lead. [2]

## Architecture decision

The first AI release will use the server-side model’s live web-search capability to answer a **research question** with a strict JSON result: a concise summary, a status of `lead`, `verified`, or `insufficient`, and a short list of source links. The system prompt forbids claiming availability, leaving dates, or platform-transfer facts without a verified catalog result. Social networks are excluded from the default search scope; the public-web source tool is restricted to reputable reporting and provider domains.

## References

[1] [Movie of the Night — Streaming Availability API](https://www.movieofthenight.com/about/api)

[2] [Reddit — Data API Terms](https://redditinc.com/policies/data-api-terms)
