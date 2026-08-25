# Final Streamwise Release Validation Ledger

**Release command:** `pnpm test && pnpm test:e2e && pnpm check && pnpm build`.

**Final result:** 17 Vitest files / 83 tests passed; 8 Playwright tests passed; TypeScript passed; production build passed. The only build advisory is the existing non-fatal JavaScript bundle-size warning. Every browser row labelled **synthetic** uses intercepted in-memory tRPC envelopes and performs no real account action or external research.

| Delivered workflow | Type and contract evidence | Browser evidence | Accessibility and keyboard evidence | Responsive evidence | Runtime evidence and boundary |
|---|---|---|---|---|---|
| Legal country discovery | `pnpm check`; `server/catalog.test.ts`; `CatalogOfferPreview.test.tsx` | Public keyboard Discovery submit | Labelled search and country selector; provider-hierarchy markup | 1280px and 375px Discovery captures | Standalone home route HTTP 200; absent token renders standby |
| Parallel AI context | `pnpm check`; `server/aiDiscovery.test.ts` | Synthetic success, loading, and error | Inspectable source link and separate-evidence label | Grounded result link fits 375px without overflow | Server-side grounding only; no live source claimed |
| Typo correction | `aiDiscovery.test.ts` | Synthetic `Tencet` resolves to `Tenet` | Corrected-query copy is tested | Included in 375px AI flow | N/A |
| Catalog offer hierarchy | `catalog.test.ts`; source markup regression | Public title/no-catalog flow | Provider-first semantics | Discovery, Recommendations, and TitlePage captures | Legal offers unavailable until permitted token exists |
| Provider-first title detail | `TitlePage.sourceBoundary.test.tsx` | `/title/movie/1` public route | Title boundary and community labels | 1280px/375px TitlePage captures | Standalone title HTTP 200 |
| External rating and critic boundary | Title source-boundary and markup tests | Title no-catalog browser flow | Outbound-only and unavailable copy | 375px TitlePage capture | Never imports protected score/review data |
| Deterministic recommendations | `catalog.test.ts`; `recommendations.test.ts` | Keyboard Recommendations navigation | Adaptation disclosure regression | 1280px/375px Recommendations captures | Standalone Recommendations HTTP 200; no-token candor |
| Explicit viewing signals | `Watchlist.viewingSignal.test.tsx`; data-access contract | Synthetic record click, error, retry | Private-status control labels | Synthetic control fit at 375px | No inferred watch history |
| Private post-watch picks | catalog and recommendation contracts | Synthetic loading/error/retry/populated card | Private-only explanatory copy | Populated card fits at 375px | No-token state is candid |
| Snapshot tracking | `availabilityTracking.test.ts`; tracking UI contract | Public Watchlist boundary | Tracking-consent language | Existing Watchlist mobile review | Compares only catalog snapshots |
| Provider alert selection | filter unit test; protected `dataAccess.test.ts` caller | Updates route smoke | Provider filter is private in-app UI | Updates responsive review | No provider account or public lead input |
| Subscription wallet and decisions | alert-service, reminder, and caller tests | Keyboard Wallet/Decisions/Updates navigation | Reminder and decision labels | Existing wallet/updates responsive checks | Member-entered data only |
| Managed scheduled refresh | `scheduledRefresh.test.ts` | N/A | N/A | N/A | Heartbeat `g4LWHU9zMwiNtvRLKVJN2x`: HTTP 200, `catalogConfigured:false` |
| Community posts and Leaving Soon leads | data-access, visibility, and fact-separation suites | Public Community route | Unverified-lead disclosure | Community 1280px/375px captures | Never promoted to catalog, alerts, or decisions |
| Leaving Soon hub | leaving-soon contracts and markup | Public hub route | Three evidence-lane disclosure | Documented desktop/mobile review | User-triggered sources only; no scraping |
| Title-linked threads | community contracts and markup | Synthetic title-context dialog | Dialog/focus coverage | Community mobile capture | Synthetic only; no persisted content |
| Replies, reports, and spoilers | `Community.nestedReply.test.tsx`; visibility tests | Synthetic nested reply and report | `Spoilers flagged` and `Spoilers` asserted | Community mobile capture | Community context only |
| Admin moderation | admin authorization and filtering tests | Synthetic hide/reload report panel | Admin panel labels | Community mobile capture | Synthetic administrator only |
| Ratings and reviews | rating aggregate, review report, and visibility tests | Synthetic report then hidden review | Keyboard focus/Enter on rating; keyboard review entry | Rating/review controls fit 375px | No fabricated rating or review |
| Application shell | `accessibilityMarkup.test.ts` | Public keyboard navigation and focus/escape flow | Semantic markup, focus, labelled controls | Full-page 1280px/375px captures | Built production app |
| Distribution | `pnpm build`; `pnpm check` | N/A | N/A | N/A | Standalone `/`, `/updates`, `/leaving-soon`, and emitted asset HTTP 200 |

The ledger documents exact evidence for each workflow at release time. It deliberately records **N/A** where an interaction dimension is not meaningful, and it does not convert synthetic browser data, a missing catalog credential, or absent provider-account integrations into claims of live user functionality.
