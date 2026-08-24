# Recent Visual Validation — 2026-08-24

Desktop verification confirmed that the provider-first title route candidly renders its no-catalog standby state without a permanently open availability dialog. The deterministic recommendations page remains legible and correctly explains that live catalog discovery is disabled rather than fabricating titles or offers.

Mobile verification at 375×812 confirmed that the title route keeps the fallback, community aggregate, rating controls, review composer, and empty-review state readable. The title-linked Community URL preserves normal signed-out behavior: the page shows contribution controls and no fabricated title/thread data. Automated signed-in auto-open behavior remains covered by implementation and regression checks; it cannot be exercised in this browser without an authenticated test session.

Signed-in desktop verification confirmed that an empty Watchlist remains candid and does not fabricate a watched record. The new private post-watch panel appears only in the authenticated Recommendations view and correctly reports that live catalog recommendations are unavailable instead of inventing picks. The private assistant visibly explains that it may use only titles the member explicitly records as watched, while continuing to exclude inferred viewing history, public community content, and financial activity.

The no-catalog title route now visibly states that IMDb, Rotten Tomatoes, and critic-reading links cannot be resolved until the catalog resolves the title, and that no external score, review text, or rating timestamp is imported without a permitted licensed provider. Desktop presentation remained readable and correctly separated this status from Streamwise community ratings.

A browser check of `/community?tmdbId=27205&mediaType=movie&title=Inception` confirmed the anonymous state remains protected: the title-linked URL is retained, but the composer does not open and the visitor is directed to sign in. The intended authenticated auto-open behavior remains covered by the focused implementation and markup regression; it cannot be manually exercised without a real signed-in browser session.

Mobile checks at 375×812 confirmed that the no-catalog title notice, outbound-rating boundary, community rating controls, review composer, and visible-review empty state remain readable without fabricated source data. Community remained usable at the same breakpoint; the admin session showed the private moderation section only with empty report states, alongside thread and contribution controls.

Authenticated desktop validation of `/community?tmdbId=27205&mediaType=movie&title=Inception` confirmed the title-linked composer opens automatically once, displays the catalog-linked Inception context, preserves the title field, and retains the title ID for publication. No discussion was submitted during this check.

At 375×812, Recommendations kept popular, top-rated, media-type, genre, and Adaptations controls legible. The screen made the private post-watch no-catalog state explicit and left deterministic catalog recommendations on standby rather than fabricating picks or provider offers.

After the provider-first card and title-source-boundary updates, the full suite passed with 15 files and 68 tests, alongside the keyboard browser check, TypeScript check, and production build. A standalone production server returned HTTP 200 for discovery, Recommendations, title, Community, and the compiled client asset before being stopped.

Signed-in desktop Watchlist validation confirmed the empty private-library state remains clear and responsive without creating a title or watched record. The explicit watched-record interaction and retry path are covered by the dedicated jsdom component test instead of manufacturing member history.

After the private-signal and title-control interaction additions, the full suite passed with 16 files and 72 tests, plus keyboard browser validation, TypeScript, and the production build. A fresh standalone server returned HTTP 200 for `/`, `/watchlist`, `/recommendations`, `/title/movie/1`, `/community`, and the compiled client asset before it was stopped.
