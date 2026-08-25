# Recent Visual Validation — 2026-08-24

## Expanded synthetic member and moderation browser validation

The browser suite now covers explicit watched-record consent and error recovery, private post-watch loading/failure/retry recovery, title-linked nested reply creation, individual reply reporting, and an administrator’s reply-hide moderation action. These seven browser checks use only intercepted synthetic responses; no real member account, user-generated content, or provider account is touched. The full release suite passed **17 Vitest files / 83 tests**, **7 Playwright checks**, TypeScript, and production build.

## Intercepted grounded-AI browser verification

The browser suite now uses a synthetic intercepted member response to verify visible grounded-AI success, title-correction, loading, and failure states. The test never invokes external research, writes a community item, or accesses a real account. The current release suite passed **17 Vitest files / 83 tests**, **3 Playwright checks**, TypeScript, and production build.

## Provider-specific confirmed-snapshot alert validation

Migration `0011_gray_scarlet_witch.sql` created the member-scoped provider alert subscription table and was applied successfully. The release passed **17 Vitest files / 83 tests**, two Playwright checks, TypeScript, and production build. The standalone production server returned HTTP `200` for `/`, `/updates`, `/leaving-soon`, and the emitted JavaScript asset, then was stopped. The new filter was unit-tested against changed legal snapshot offers only; no live provider account, community report, or public-web lead was used as alert input.

## Leaving-soon and grounded-AI release validation

The release suite passed with **17 Vitest files / 81 tests**, two Playwright checks, TypeScript, and production build. The sandbox reset temporarily removed the Playwright browser binary; it was restored before the browser checks were rerun successfully. The standalone production server returned HTTP `200` for `/`, `/leaving-soon`, `/community`, `/title/movie/1`, and the emitted JavaScript asset, then was stopped.

## Leaving Soon hub — desktop and mobile review

Desktop review showed the three evidence lanes—confirmed provider checks, community leads, and grounded public-web context—at equal visual weight and with a clear credential-free provider-readiness notice. At 375×812, the cards stacked cleanly, labels remained legible, the compact navigation stayed reachable, and the research control remained visible without horizontal overflow. The checks used signed-out, no-catalog states and did not submit a community lead or invoke public-web research.

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

## Current uncheckpointed release verification

After the provider-hierarchy, title-discussion-link, review-report action, and original-problem audit updates, the complete release suite passed with **17 Vitest files / 76 tests**, one Playwright keyboard route-and-labelled-discovery test, TypeScript checking, and the production build. Vite emitted only its existing non-fatal bundle-size advisory.

The compiled app was then started with `NODE_ENV=production PORT=4173 pnpm start`, independent of the development watcher. HTTP `200` responses were confirmed for `/`, `/watchlist`, `/recommendations`, `/title/movie/1`, `/community`, and the emitted JavaScript asset. The temporary standalone process was stopped after the check. The absent `TMDB_ACCESS_TOKEN` remains intentionally visible as candid catalog standby behavior; this verification does not claim an authenticated browser mutation or a live managed-Heartbeat callback.

The current browser-session audit of `/watchlist` explicitly returned the signed-out screen and a **Sign in** control. Accordingly, no saved-title mutation, watched-record mutation, private post-watch recovery, thread/reply/report action, or moderation action was attempted or claimed in this browser session.

The browser suite now also checks two rendered public flows: keyboard discovery/navigation, and the title-detail no-catalog source boundary together with signed-out Watchlist and Community contribution boundaries. Both Playwright tests passed without writing member records or submitting public content.

The configured title-page contract now renders permitted TMDb metadata only when supplied—release date, runtime, and genres—and provides clearly labelled outbound reading destinations for RogerEbert.com, Variety, and The Guardian alongside the existing IMDb and Rotten Tomatoes references. The full release suite passed after this addition: **17 Vitest files / 77 tests**, two Playwright tests, TypeScript, and production build. These links remain outbound references; Streamwise imports neither scores nor review text.
