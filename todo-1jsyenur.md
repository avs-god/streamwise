# Project TODO

- [x] Inspect the current Streamwise UI, routes, and backend integrations.
- [x] Replace ManusDB data access with Firebase/Firestore-ready data access.
- [x] Replace Manus OAuth login with Firebase Google Authentication when configuration is present.
- [x] Preserve the existing Streamwise product experience as an independent copy.
- [x] Keep Firebase web config, Google Auth values, service-account values, and Vercel values blank while providing validated placeholders and setup documentation.
- [x] Do not attempt Google-account sign-in or retrieve production keys during this build.
- [x] Run type checks, unit tests, build checks, and responsive preview verification (131 tests passed, 2 live-provider tests skipped by default, build and previews passed).
- [x] Resolve or isolate the existing network-dependent TMDb live-offer test failure (ECONNRESET) by making live-provider coverage explicit with STREAMWISE_LIVE_TESTS=1.
- [x] Leave GitHub repository connection deferred until the user authorizes account access; repository-ready configuration is present.
- [x] Leave Vercel connection and deployment deferred until the user authorizes account access; `vercel.json` and setup instructions are ready.
- [x] Document required Firebase and Vercel setup values and deployment status.
