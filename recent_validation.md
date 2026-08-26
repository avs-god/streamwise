# Recent Visual Validation — 2026-08-24

## Per-workflow release inventory

`validation_matrix.md` now maps each Streamwise workflow to its contract, browser, accessibility, responsive, and production or managed-runtime evidence. The inventory explicitly distinguishes intercepted synthetic browser data from actual live operations and records the absent catalog credential as a production limitation rather than a pass-through result.

## Final full-suite rerun

After the populated responsive assertions and matrix update, the final suite passed **17 Vitest files / 83 tests**, **8 Playwright checks**, TypeScript, and production build. The browser suite includes synthetic mobile-width checks for a grounded AI result, a populated private recommendation card, and authenticated title rating/review controls. The build retains only the pre-existing non-fatal JavaScript bundle-size warning.

The final synthetic title-review browser flow also focuses the `5 ★` rating control, activates it with Enter, focuses the review composer, and enters a review by keyboard before exercising the report/hidden-state path.

## Cross-surface responsive validation

Desktop (`1280×720`) and mobile (`375×812`) full-page captures were reviewed for Discovery with AI context, Community, Recommendations, and the no-catalog title-detail/community-review state. The mobile navigation retained accessible icon-and-label destinations, long Community and title content reflowed without horizontal truncation, and the legal-catalog standby and unverified-context disclosures remained legible. These captures used the current no-token environment; they verify layout and candid state handling rather than claiming live legal offers or real member writes.

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

## Recovered final provider-comparison release — 2026-08-25

After sandbox recovery, the final release suite passed **18 Vitest files / 84 tests**, **8 Playwright checks**, TypeScript, and production build. The compiled app independently returned HTTP `200` for Discovery, Recommendations, Wallet, title detail, Leaving Soon, and its generated asset. Its production title procedure returned separately labelled TMDb/JustWatch, Watchmode, and Streaming Availability by Movie of the Night records for India; no credential was exposed.

The rendered `/title/movie/27205` consumer route showed primary TMDb/JustWatch country offers, a separate timestamped Watchmode panel retaining SD/HD/4K details, and a separate timestamped Streaming Availability panel with provider outbound links, price when returned, and the required visible Movie of the Night attribution. The direct grounded response remains public-web context only; it cannot make discussion material a legal availability fact.

## Conversational web answer and AI recommendation chat — 2026-08-25

The AI web-answer flow now presents a direct conversational synthesis of public search context while keeping inspectable links and a separate licensed country-specific offer path. Its contract covers 2012-title resolution, direct wording, source retention, sensitive-content rejection, and legal-catalog separation.

Recommendations now includes an AI chat-style prompt for genres, languages, moods, and liked titles or shows. The model only translates the request into bounded catalog filters; returned picks come from TMDb catalog similarity or discover routes. Validation passed: **19 Vitest files / 88 tests**, **9 Playwright checks**, TypeScript, and production build, with desktop and 375px visual review of the recommendation chat.

## Saved taste profiles, filters, follow-ups, and public-web research surfaces — 2026-08-25

Applied additive migration `0012_safe_wilson_fisk` for an optional member-owned taste profile. The recommendation chat now supports explicit original-language and maximum film-runtime filters, optional saved preference reuse for signed-in members, and “More like this” follow-ups that carry only the active prompt and selected catalog title.

Source-linked public-web research entry panels now appear in Discovery, after a recommendation request, and on title detail. They remain separate from the licensed catalog, snapshots, tracking, alerts, and decisions. Validation passed: **19 Vitest files / 89 tests**, **9 Playwright checks**, TypeScript, production build, desktop/mobile review, and independent compiled-server HTTP checks for `/`, `/recommendations`, `/title/movie/27205`, and a generated asset.

## Service actions, commands, settings, and portability — 2026-08-25

AI recommendation result cards now expose an authenticated **Save to watchlist** control. It waits for the resolved legal-title detail and persists the member’s selected title together with country, typed legal offers, check time, and legal-source URL rather than an inferred availability.

The Assistant includes a natural-language action-review panel for explicit private watchlist removal and wallet pause/cancellation-planning commands. Every command returns a labelled confirmation and only affects the signed-in member’s Streamwise record after the member confirms; it never contacts a provider or changes external billing. The new `/settings` route manages optional taste-profile fields and links to alert controls. `api/index.ts`, `vercel.json`, and `DEPLOYMENT.md` prepare the repository for GitHub/Vercel or a standard Node host. Validation passed: **19 Vitest files / 90 tests**, **9 Playwright checks**, TypeScript, production build, desktop review, and standalone production HTTP checks for `/`, `/recommendations`, `/assistant`, `/settings`, `/title/movie/27205`, and a generated asset.

## Community rating and critic-reference completion — 2026-08-25

Recommendation cards now expose a live Streamwise community-rating summary and direct members to the linked title page to read or contribute ratings and reviews. Title pages retain source-linked IMDb, Rotten Tomatoes, RogerEbert.com, Variety, and Guardian destinations without copying external scores or protected review text. Nested title threads, replies, review reporting, visibility filtering, and moderator actions remain available and covered by focused contracts.

## Final portable backend and direct-GPT configuration — 2026-08-25

Added Firebase deployment assets (`firebase.json`, `firestore.rules`, and `firestore.indexes.json`) plus `FIREBASE_MIGRATION.md`. The document maps current SQL entities to Firebase Authentication UID-scoped and public/moderated Firestore collections, provides emulator and cutover guidance, and keeps all credentials out of source control. Grounded AI now supports an explicit server-only `AI_PROVIDER=openai` path through the standard Responses API with web search, `OPENAI_API_KEY`, optional base URL, and model name; the managed provider remains a fallback until the independent values are configured.

The final suite passed **19 Vitest files / 90 tests**, **9 Playwright checks**, TypeScript, production build, and static validation of the Firebase artifacts. The built server remains independently runnable with provider values absent, using candid inactive-provider states.

## Direct Leaving Soon grounded response — 2026-08-25

Leaving Soon title and provider queries now display the validated direct grounded-model response in the public-web lane, followed by inspectable reporting and public-discussion links. The lane stays explicitly separate from confirmed saved-title snapshots and unverified community reports, and cannot create a departure date, legal offer, or alert by itself. Focused grounded-AI contracts, the browser suite, TypeScript, and the production build passed after this update.

## Managed fallback and confirmed provider-change delivery readiness — 2026-08-26

The managed AI path stays active when `AI_PROVIDER=openai` is selected without `OPENAI_API_KEY`; the dedicated fallback contract passed. When both values are added later, Streamwise automatically prioritizes the direct OpenAI-compatible Responses API path. Updates now includes a private provider-change digest assembled exclusively from observed country-specific snapshots, plus opt-in email controls and a candid Resend readiness state.

Resend delivery remains server-only and makes no network request until both `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` exist. Once configured, it sends an opted-in availability-change update only for an observed legal snapshot difference and only to a member account with an email address; community and public-web leads are never included. Focused AI/email contracts passed **13 tests**, TypeScript and production build passed, and the inactive-provider Updates UI was visually reviewed.
