# GitHub and Vercel Handoff

This project is ready to be connected to GitHub and Vercel later. The current build intentionally performs no account sign-in, repository creation, or deployment, and no access token is stored in source control.

## GitHub

Create a new **private** repository named `streamwise` in the user's GitHub account, then upload the project contents from this checkpoint. Keep the default branch as `main`. Do not upload `.env` files, Firebase service-account JSON, or any private key. The included `.gitignore` is the source-of-truth protection for local secrets and generated build output.

## Vercel

Import the private GitHub repository into Vercel. Keep the repository's `vercel.json` settings: install with `pnpm install --frozen-lockfile`, build with `pnpm build`, serve `dist/public`, route `/api/*` to the API entry point, and route the remaining SPA paths to `index.html`.

Before enabling Firebase, add the six browser configuration variables documented in `FIREBASE_SETUP.md` to the Vercel project environment for Preview and Production. Add server-side Firebase Admin variables only if trusted server routes are activated. Firebase and Vercel credentials must remain in encrypted dashboard environment variables, never in GitHub.

The current Manus-hosted preview remains available at `https://streamwise-anywmyyi.manus.space` for review. Connecting GitHub and Vercel is a separate authorized-account step and can be completed when the user is ready.
