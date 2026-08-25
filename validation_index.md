# Streamwise Workflow Validation Index

The final `pnpm check` passed across the application after the listed browser and documentation changes. “Synthetic” browser evidence uses only intercepted in-memory tRPC envelopes; it neither accesses a real account nor writes user content. “N/A” means the dimension does not apply to that server-only workflow.

| Workflow | Type | Unit / contract | Browser | Accessibility | Responsive | Runtime |
|---|---|---|---|---|---|---|
| Legal country search and source timestamp | `pnpm check` | `catalog.test.ts`; `CatalogOfferPreview.test.tsx` | Keyboard Discovery submit | Provider hierarchy markup | Desktop/mobile Discovery capture | Standalone `/` HTTP 200; no-token standby |
| Parallel AI public-web compartment | `pnpm check` | `aiDiscovery.test.ts` | Synthetic success/loading/error | Source-boundary markup | Synthetic 375px grounded link | Server-side only; no live research claimed |
| Title typo correction | `pnpm check` | `aiDiscovery.test.ts` | Synthetic `Tencet → Tenet` | Correction copy regression | Same 375px flow | N/A |
| Public-web source retention | `pnpm check` | `aiDiscovery.test.ts` | Synthetic named link | Unverified label regression | Same 375px flow | N/A |
| Provider-first detail page | `pnpm check` | `TitlePage.sourceBoundary.test.tsx` | Public no-catalog title route | Provider-first markup | Desktop/mobile TitlePage capture | Standalone `/title/movie/1` HTTP 200 |
| External rating and critic boundaries | `pnpm check` | Title source-boundary and markup tests | Public unavailable-state route | Explicit outbound-only copy | Mobile TitlePage capture | No licensed rating import |
| Deterministic catalog discovery | `pnpm check` | `catalog.test.ts`; `recommendations.test.ts` | Keyboard Recommendations route | Adaptation disclosure markup | Desktop/mobile Recommendations capture | Standalone `/recommendations` HTTP 200 |
| Watchlist and explicit watched record | `pnpm check` | `Watchlist.viewingSignal.test.tsx`; data access | Synthetic explicit click/error/retry | Private-signal labels | Private control fit exercised at 375px in browser | N/A |
| Private post-watch picks | `pnpm check` | `catalog.test.ts`; recommendation contracts | Synthetic loading/error/retry/card | Private-only copy regression | Synthetic populated card at 375px | No-token candid state |
| Snapshot-based availability tracking | `pnpm check` | `availabilityTracking.test.ts` | Public Watchlist boundary route | Tracking UI contract | Existing mobile Watchlist review | Live refresh requires catalog token |
| Provider-alert subscriptions | `pnpm check` | filter and protected-call tests | Updates route smoke | Private in-app copy | Existing Updates responsive layout review | No provider account access |
| Subscription decisions and reminders | `pnpm check` | alert service and data access tests | Keyboard Wallet/Decisions/Updates navigation | Reminder UI contract | Existing responsive wallet/updates validation | Entered data only |
| Managed refresh callback | `pnpm check` | `scheduledRefresh.test.ts` | N/A | N/A | N/A | Heartbeat HTTP 200; `catalogConfigured:false` |
| Community contribution and leaving-soon lead | `pnpm check` | data access; visibility; source boundary | Community public route | Unverified lead/disclosure markup | Desktop/mobile Community capture | Never promoted to catalog or alert |
| Leaving Soon hub | `pnpm check` | leaving-soon markup/data contract | Public Leaving Soon route | Three-lane evidence labels | Desktop/mobile Leaving Soon review | User-triggered research only |
| Title-linked thread composer | `pnpm check` | Community contracts and markup | Synthetic title-context auto-open | Dialog labels/focus test | Community mobile capture | Synthetic only; no write |
| Nested replies and reports | `pnpm check` | `Community.nestedReply.test.tsx` | Synthetic nested reply and report | Reply/report labels | Community mobile capture | Synthetic only; no write |
| Spoiler labels | `pnpm check` | spoiler markup test | Synthetic `Spoilers flagged` / `Spoilers` assertions | Spoiler label semantics | Community mobile capture | N/A |
| Community moderation | `pnpm check` | admin authorization and visibility tests | Synthetic admin reply hide/refresh | Admin panel labels | Community mobile capture | Synthetic admin only |
| Ratings and title reviews | `pnpm check` | rating aggregate, review report, visibility tests | Synthetic report/hidden state plus keyboard focus/Enter on `5 ★` and keyboard review entry | Title review controls | Synthetic rating and review control at 375px | No fabricated reviews |
| Application shell and keyboard routes | `pnpm check` | `accessibilityMarkup.test.ts` | Keyboard route/focus/escape test | Semantics and focus checks | Desktop/mobile full-page captures | Built production app |
| Production distribution | `pnpm build` | N/A | N/A | N/A | N/A | Standalone `/`, `/updates`, `/leaving-soon`, assets HTTP 200 |

The index is read alongside `validation_matrix.md`, `recent_validation.md`, and `scheduler_verification.md`. It intentionally does not convert the absent catalog credential, synthetic browser data, or the absence of provider-account integration into a claim of live functionality.
