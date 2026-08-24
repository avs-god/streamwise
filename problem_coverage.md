# Streamwise Problem-Coverage Audit

## Purpose

This audit maps the consumer problems captured in the original Streamwise brief to implemented product capabilities and their evidence boundaries. It distinguishes **implemented product behavior** from the separate operational requirement to configure a licensed live catalog credential.

| Consumer problem | Streamwise response | Evidence and constraint |
|---|---|---|
| Fragmented title discovery | A unified Discovery action runs the country-aware legal catalog and separately labelled AI public-web context. Deterministic discovery provides popular, top-rated, genre, similar, and explicit private post-watch paths. | Legal offers are shown only from the configured TMDb/JustWatch boundary. Without a token, every catalog surface remains candidly on standby. Public-web context is never converted into an offer fact. |
| Country-specific platform churn | Title offers retain country, provider, offer category, retrieval timestamp, source link, and optional snapshots. Members can opt into observed availability tracking and in-app alerts. | Changes are comparisons of saved legal snapshots. The refresh callback safely skips catalog work when no token exists. |
| Leaving-soon uncertainty | Community observations can identify a leaving-soon lead and include a source link; member reports and moderation controls manage public visibility. | These are always labelled unverified and cannot change alerts, tracking, provider facts, or subscription decisions. |
| Subscription sprawl and cost ambiguity | The wallet records member-entered plan, price, cycle, renewal, and status. The decision view computes monthly and annual equivalents and explains keep, pause, or cancel suggestions. | The decision engine uses saved Streamwise data only. It excludes bank activity, transaction history, credit data, and inferred affordability. |
| Cancellation friction | Provider guides, plan lifecycle actions, cancellation/renewal tracking, pause reviews, and next actions support deliberate follow-through. | Streamwise links outward for provider actions; it does not impersonate a provider or execute cancellation on a member’s behalf. |
| Need for legal alternatives | Provider-first cards and title pages separate subscription, ad-supported, free, rental, and purchase choices. | Availability uses JustWatch via TMDb when configured, carries attribution and timestamp, and is never filled from scraped pages or discussion. |
| Movie-buff discussion | Title-linked spoiler-aware threads, nested replies, reports, and administrator-only moderation coexist with title ratings and reviews. | Community content is anonymous by default, unverified, and excluded from private profiling, catalog evidence, and deterministic recommendations. |

## Verification status

The implementation includes automated data-access, boundary, component, and keyboard coverage, plus mobile and standalone production-runtime checks. The operational boundary is intentionally visible: live country-specific availability, populated title details, and live catalog recommendations require a permitted server-side credential. The app does not manufacture substitutes while that credential is absent.
