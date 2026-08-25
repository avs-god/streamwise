# Firebase / Firestore Independent Backend Migration

## Purpose

This repository can be moved from its current SQL/tRPC deployment to Firebase Authentication, Cloud Firestore, Cloud Functions or Cloud Run, and a standard Node or Vercel frontend deployment. The migration is **not activated** in the current release: it requires the project owner to create a Firebase project and provide deployment-time configuration values. No Firebase credential is committed here.

> Firebase recommends pairing Authentication with Firestore Security Rules for user- and role-based access controls.[1] Firestore server clients bypass Security Rules, so privileged scheduled work and imports must use narrowly scoped service-account IAM instead of browser credentials.[1]

## Collection mapping

| Current domain | Firestore location | Access model |
|---|---|---|
| Account, taste profile, alert preferences | `users/{uid}` and `users/{uid}/preferences/default` | Owner only |
| Watchlist, provider snapshots, private signals | `users/{uid}/watchlist/*`, `availabilitySnapshots/*`, `viewingSignals/*` | Owner only |
| Wallet, plans, reminders | `users/{uid}/subscriptions/*`, `alerts/*` | Owner only |
| Reviews and ratings | `titleReviews/{reviewId}`, `titleRatings/{titleId_uid}` | Public visible reads; author writes; admin moderation |
| Threads and replies | `communityThreads/{threadId}/replies/{replyId}` | Public visible reads; author writes; admin moderation |
| Reports and moderation queue | `moderation/*` | Admin service only |

## Independent provider configuration

Set values in Firebase Functions/Cloud Run/Vercel secrets, not browser source:

| Purpose | Server-only variables |
|---|---|
| Catalog | `TMDB_ACCESS_TOKEN`, `WATCHMODE_API_KEY`, `RAPIDAPI_STREAMING_AVAILABILITY_KEY` |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| LLM/web research | `AI_PROVIDER=openai`, `OPENAI_API_KEY`, optional `OPENAI_BASE_URL`, optional `OPENAI_MODEL` |
| Admin backend | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |

The browser may contain only Firebase web configuration, `VITE_GOOGLE_OAUTH_CLIENT_ID`, and approved AdSense public identifiers. With `AI_PROVIDER=openai`, Streamwise calls the standard Responses API server-side with the provider's web-search tool and returns only structured, source-linked results; without those values, it falls back to the managed provider in the current deployment and remains candid if no provider is configured. IMDb and Rotten Tomatoes output stays outbound-only until a license/API contract is supplied; do not scrape or cache protected review text or scores.

## Cutover sequence

1. Create Firebase Authentication with Google sign-in and set the production callback and authorized domains.
2. Deploy `firestore.rules` and emulator-test owner, public visible-read, and moderator paths before importing data. Firebase evaluates every client request against the deployed rule set.[1]
3. Export current tables into a controlled JSON dataset, map numeric members to Firebase Auth UIDs, and import private data under `users/{uid}`; do not copy session tokens or provider keys.
4. Re-key public review/thread records with immutable Firestore IDs, retain `userId`, `status`, source URL, country, and timestamps, then backfill rating aggregates using a trusted server job.
5. Move scheduled catalog refresh and email dispatch into Cloud Scheduler plus Cloud Run/Functions. Each handler must re-check member preferences and provider results server-side and be idempotent.
6. Deploy the portable Node/Vercel or Cloud Run server, configure direct OAuth, database, model, email, and catalog secrets, then run staging smoke tests before DNS cutover.

Firestore managed export/import is a separate operational feature that uses Cloud Storage and billing; exports and imports incur document read/write costs, so use it for backup/restore after the initial application-data migration.[2]

## Local validation

Install Firebase CLI independently, run `firebase emulators:start --only auth,firestore`, then deploy rules using `firebase deploy --only firestore:rules` against a non-production project. Test anonymous reads, owner writes, a different user's denied write, and moderator-only transitions. Never run a migration against production without a reviewed backup and a rollback window.

## References

[1]: https://firebase.google.com/docs/firestore/security/get-started "Cloud Firestore Security Rules"
[2]: https://firebase.google.com/docs/firestore/manage-data/export-import "Cloud Firestore export and import"
