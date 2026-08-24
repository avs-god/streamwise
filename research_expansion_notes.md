# Streamwise Expansion Research Notes

## Public consumer signals

The user-provided second brief identifies three connected needs: legal title discovery across subscription, rental, and purchase offers; awareness of catalog changes; and a single place to manage streaming subscriptions. These needs align with public consumer reporting without requiring the collection of personal information.

| Source | Public finding | Product implication |
| --- | --- | --- |
| [Times of India, 19 August 2025](https://timesofindia.indiatimes.com/entertainment/hindi/bollywood/news/need-an-excel-sheet-to-track-my-ott-subscriptions/articleshow/123383595.cms) | Interviewed viewers describe forgotten autopay subscriptions, uncertainty about total cost, retention driven by future releases, service fragmentation, and rentals or purchases outside the subscription. | Add a total-cost wallet, explicit subscription status and renewal actions, a title-level offer comparison, and reminders driven by the user’s saved intent rather than speculative churn. |
| [Consumer Reports, updated 13 April 2026](https://www.consumerreports.org/electronics-computers/streaming-media/guide-to-streaming-video-services-a4517732799/) | Consumer guidance distinguishes paid services, lower-cost ad-supported tiers, and free services as relevant selection choices. | Treat free/ad-supported, subscription, rental, and purchase as distinct offer types. Do not imply that a subscription covers every title. |

## Design constraints established from research

1. Streamwise must never fabricate availability, pricing, plan eligibility, catalog departure dates, or cancellation outcomes.
2. “Leaving soon” cannot be asserted without an upstream source that supplies it. Until such a signal is supported, the product should track observed availability-snapshot changes and label them accordingly.
3. Alerts must be opt-in and comprehensible. Initial alerts should be stored and shown in-app; external delivery only follows explicit consent and a deployed scheduled workflow.
4. Public consumer commentary is used only to identify feature priorities. Streamwise will not scrape private accounts, reuse personal identifiers, or manufacture user reviews, testimonials, or ratings.

## Availability source capability

The [TMDb Watch Providers documentation](https://developer.themoviedb.org/reference/movie-watch-providers) confirms country-specific provider categories for **flatrate**, rental, and purchase offers, along with a source link. It requires JustWatch attribution and does not provide provider deep links directly. The API documentation does not promise a “leaving soon” field or full deep links. The expanded product will therefore compare persistent, timestamped availability snapshots and call a change only when a later retrieved snapshot differs. It will link through the documented TMDb/JustWatch source URL and label the retrieval time, country, and source.
