# Portable deployment

Streamwise is a full-stack React, Express, and tRPC application. It can be exported to GitHub and deployed on a Node-compatible platform. Manus hosting remains the configured production target, but the repository now includes a Vercel serverless entrypoint.

## GitHub and Vercel

Push this repository to GitHub, import it into Vercel, and use the included `vercel.json`. The build command creates the static client bundle and copies it to Vercel’s `public` directory; `/api/*` requests use `api/index.ts`, while other routes fall back to the single-page client.

Set the same server-side environment variables in Vercel that the full-stack application requires: `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `TMDB_ACCESS_TOKEN`, `WATCHMODE_API_KEY`, and `RAPIDAPI_STREAMING_AVAILABILITY_KEY`. Configure the OAuth callback URL for the chosen domain before enabling sign-in. Do not expose any of these secret values with a `VITE_` prefix.

> Vercel’s serverless runtime is appropriate for request/response APIs and the existing authenticated refresh callback. It is not a replacement for long-running workers; recurring refreshes should continue to use the deployed scheduler or a platform scheduler that sends the configured callback identity.

## Independent Node deployment

For any Node-compatible host, run `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm start`. Set `PORT` if the host provides one. The server serves the compiled client and its API from a single process.
