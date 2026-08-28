# Portable deployment

Streamwise is a full-stack React, Express, and tRPC application. The repository supports the managed deployment and an independent Node-compatible deployment from GitHub. Vercel uses the committed `api/index.ts` serverless entrypoint for API requests and `dist/public` for the compiled single-page client.

## GitHub and Vercel

Import the repository into Vercel without overriding the project settings. The committed `vercel.json` uses `pnpm install --frozen-lockfile`, runs `pnpm build`, serves `dist/public`, and maps `/api/*` requests to the Express function. The function normalizes Vercel's rewritten `/api/index` pathname back to the public `/api/trpc`, `/api/auth`, `/api/scheduled`, and storage paths before Express routing runs. The final rewrite sends non-API paths to `/index.html`, allowing the React router to handle application pages.

This follows Vercel's project-configuration, Node.js runtime, and environment-variable model. [1] [2] [3]

## Environment variables

Configure variables in the Vercel project settings for the Production environment, and repeat them for Preview when preview deployments need the same integrations. Never commit `.env` files or put server-only secrets behind a `VITE_` prefix. Vercel documents environment variables as deployment configuration outside the source tree. [3]

| Variable group | Variables | Behavior when absent |
| --- | --- | --- |
| Runtime and database | `DATABASE_URL`, `JWT_SECRET` | The independent server cannot persist authenticated data until these are configured. |
| Portable Google OAuth | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `VITE_GOOGLE_OAUTH_CLIENT_ID` | Manus OAuth remains the managed fallback; the independent Google path is inactive. Register `https://your-domain/api/auth/google/callback` with Google. |
| Verified catalog | `TMDB_ACCESS_TOKEN`, `WATCHMODE_API_KEY`, `RAPIDAPI_STREAMING_AVAILABILITY_KEY`, `OMDB_API_KEY` | The affected provider lane is skipped or reports an inactive state; the remaining catalog sources continue. |
| Independent AI research | `AI_PROVIDER=openai`, `OPENAI_API_KEY`, optional `OPENAI_BASE_URL`, optional `OPENAI_MODEL` | Managed research remains active. Direct OpenAI-compatible web research is selected only when `AI_PROVIDER=openai` and the key are both present. |
| Email notifications | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Email delivery remains inactive and in-app notifications continue. Activate only after the sender domain is verified in Resend. |
| Browser push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Push subscription and delivery remain inactive-safe. `VAPID_SUBJECT` must be a `mailto:` contact address or an HTTPS contact URL. |
| Analytics and advertising | `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`, `VITE_ADSENSE_CLIENT_ID`, `VITE_ADSENSE_DISCOVERY_SLOT_ID` | Analytics and sponsored placements are not loaded. These are public identifiers, not secret credentials. |

The client analytics loader is now conditional, so an unset analytics endpoint cannot produce a malformed script URL during a Vercel build. The advertising surface is likewise provider-ready and does not fabricate sponsored content when its identifiers are absent.

## AI and email activation order

Streamwise keeps the managed research path active by default. To move a deployment to an independent OpenAI-compatible provider, set `AI_PROVIDER=openai` and a server-only `OPENAI_API_KEY`; `OPENAI_BASE_URL` is optional for a compatible endpoint and `OPENAI_MODEL` defaults to `gpt-4.1-mini`. The direct Responses API with web search takes precedence only when both the provider selection and key exist. If either is absent, Streamwise continues with the managed path rather than exposing a configuration failure to users.

For email, provide `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only after the sender domain is verified in Resend. Until both values are set, opt-in email features remain inactive and in-app notifications continue to function. Neither OpenAI nor Resend credentials are sent to the browser.

> Vercel Functions are appropriate for request/response APIs and the authenticated refresh callback. They are not a replacement for long-running workers; recurring refreshes should use the deployed scheduler or an external scheduler that calls the configured callback. [4]

## Independent Node deployment

For any Node-compatible host, run `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm start`. Set `PORT` if the host provides one. The standalone server serves the compiled client and its API from a single process. The same environment-variable rules apply, except that the host—not Vercel—provides the environment-variable management.

## Local verification

The portable release can be checked with the following commands:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test
pnpm exec esbuild api/index.ts --platform=node --packages=external --bundle --format=esm --outfile=.tmp-vercel-api.mjs
node scripts/vercel-smoke.mjs
rm -f .tmp-vercel-api.mjs
```

The smoke test imports the compiled serverless adapter, exercises `/api/trpc/auth.me`, exercises the rewritten `/api/index/trpc/auth.me` equivalent, and verifies that both paths return the same response class without requiring provider credentials.

## References

[1]: https://vercel.com/docs/project-configuration "Vercel Project Configuration"
[2]: https://vercel.com/docs/functions/runtimes/node-js "Vercel Node.js Runtime"
[3]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"
[4]: https://vercel.com/docs/functions "Vercel Functions"
