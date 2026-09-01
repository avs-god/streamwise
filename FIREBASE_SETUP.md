# Firebase and Vercel Setup

The independent Streamwise copy is wired for Firebase Authentication with Google sign-in and Cloud Firestore, but the integration is intentionally inactive until configuration is supplied. No Firebase, Google, or Vercel secret is stored in this repository.

| Variable | Used by | Required when activating | Purpose |
|---|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Browser | Yes | Firebase Web SDK project key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Browser | Yes | Firebase Authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Browser and server | Yes | Firebase project identifier. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Browser | Yes | Firebase storage bucket identifier. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Browser | Yes | Firebase messaging sender identifier. |
| `VITE_FIREBASE_APP_ID` | Browser | Yes | Firebase Web App identifier. |
| `FIREBASE_CLIENT_EMAIL` | Trusted server only | If server Admin SDK is enabled | Service-account email. |
| `FIREBASE_PRIVATE_KEY` | Trusted server only | If server Admin SDK is enabled | Service-account private key; keep only in Vercel encrypted environment variables. |

To activate the integration, create a Firebase project, enable Google under Authentication, create a Web App, and add the six `VITE_FIREBASE_*` values to the Vercel project environment. Add the production Vercel domain to Firebase Authentication's authorized domains. Deploy the included `firestore.rules` before allowing user data writes.

The frontend initializes Firebase only when all six web values are non-empty. Until then, the existing managed authentication and server routes remain available, so the preview stays usable without credentials. The Firestore repository is scoped to `users/{uid}` and its `preferences/default` subcollection, matching the repository's migration map.

For Vercel, import the GitHub repository, keep the existing `vercel.json`, use `pnpm install --frozen-lockfile` for installation, and use `pnpm build` for the build. Leave all Firebase and Vercel credentials blank in source control; set them only in the Vercel dashboard when you are ready.
