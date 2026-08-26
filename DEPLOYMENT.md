# Portable deployment

Streamwise is a full-stack React, Express, and tRPC application. It can be exported to GitHub and deployed on a Node-compatible platform. Manus hosting remains the configured production target, but the repository now includes a Vercel serverless entrypoint.

## GitHub and Vercel

Push this repository to GitHub, import it into Vercel, and use the included `vercel.json`. The build command creates the static client bundle and copies it to Vercel’s `public` directory; `/api/*` requests use `api/index.ts`, while other routes fall back to the single-page client.

For a fully independent deployment, configure `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `VITE_GOOGLE_OAUTH_CLIENT_ID`; register `https://your-domain/api/auth/google/callback` with Google. The client automatically uses this standard OAuth path when the public client ID is present. Configure `TMDB_ACCESS_TOKEN`, `WATCHMODE_API_KEY`, `RAPIDAPI_STREAMING_AVAILABILITY_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `VITE_ADSENSE_CLIENT_ID`, and `VITE_ADSENSE_DISCOVERY_SLOT_ID` only after their respective accounts/domains are approved. Empty values leave email and sponsored placement inactive without breaking the application. Do not expose any secret values with a `VITE_` prefix; the Google OAuth client ID and AdSense publisher/slot IDs are public identifiers by design.

## AI and email activation order

Streamwise keeps the current managed research path active by default. To move a deployment to the independent provider, set `AI_PROVIDER=openai` and a server-only `OPENAI_API_KEY`; `OPENAI_BASE_URL` is optional for a compatible endpoint and `OPENAI_MODEL` defaults to `gpt-4.1-mini`. The direct Responses API with web search takes precedence only when both the provider selection and key exist. If either is absent, Streamwise automatically continues with its managed research path rather than exposing a configuration failure to users.

For email, provide `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only after the sender domain is verified in Resend. The sender value must be a valid verified address or display-name/address pair. Until both values are set, opt-in email features remain inactive and in-app notifications continue to function. Neither OpenAI nor Resend credentials are ever sent to the browser.

> Vercel’s serverless runtime is appropriate for request/response APIs and the existing authenticated refresh callback. It is not a replacement for long-running workers; recurring refreshes should continue to use the deployed scheduler or a platform scheduler that sends the configured callback identity.

## Independent Node deployment

For any Node-compatible host, run `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm start`. Set `PORT` if the host provides one. The server serves the compiled client and its API from a single process.
