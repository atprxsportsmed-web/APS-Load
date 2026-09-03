# Load app — standalone web build

A self-contained copy of the **Athlete Load Decision Tool** (Expo Router app,
"ATPRX Athlete Center") set up to build as a static web app and deploy as its
own Vercel project.

It is a *copy*, not a workspace package: it has no `@workspace/*` dependencies,
no pnpm-workspace linkage, and its own lockfile. Lift the directory out and it
is a complete repo.

## Making it its own repo

```bash
cp -R load-app-web ~/load-app && cd ~/load-app && git init && git add -A && git commit -m "Initial commit"
```

Then push to GitHub and import the repo in Vercel. `vercel.json` supplies the
build settings, so no framework preset is needed — leave Vercel's framework
detection on "Other".

## Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and locally in
`.env` (see `.env.example`). `EXPO_PUBLIC_*` values are inlined into the client
bundle at build time, so they must be public-safe and a rebuild is required
after changing them.

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | Clerk frontend key (`pk_test_…` / `pk_live_…`). The app renders a blank splash until Clerk loads, so a valid key is needed for anything to show. |
| `EXPO_PUBLIC_API_URL` | no | Full origin of the API server, e.g. `https://api.example.com`. Unset → the app runs on local storage only. |
| `EXPO_PUBLIC_DOMAIN` | no | Bare-domain fallback for the above (`https://` is prepended). Kept for parity with the monorepo build. |
| `EXPO_PUBLIC_CLERK_PROXY_URL` | no | Only if Clerk is fronted by your own domain. |

Two things to set up on the API side once this is deployed:

- **CORS** — the API server must allow the Vercel origin, since the web app now
  calls it cross-origin.
- **Clerk** — add the Vercel domain to the allowed origins / redirect URLs in
  the Clerk dashboard.

## Commands

```bash
npm install
npm run web        # dev server in a browser
npm run dev        # Expo dev server (also serves iOS/Android)
npm run build      # static web export into dist/
npm run typecheck  # tsc --noEmit
```

## How it differs from `artifacts/mobile`

- `@workspace/api-client-react` is vendored into `lib/api-client/`; imports use
  the `@/lib/api-client` path alias. Its `index.ts` also re-exports
  `customFetch`, which the upstream package's barrel did not export even though
  `services/*Api.ts` import it from there.
- API base URL reads `EXPO_PUBLIC_API_URL` first, falling back to
  `EXPO_PUBLIC_DOMAIN`. Upstream only understood the Replit-supplied domain.
- Clerk's native `tokenCache` (backed by `expo-secure-store`, which has no web
  implementation) is not passed on web; Clerk uses browser storage there.
- `app.json` declares `web.bundler: metro` and `web.output: single` (SPA), and
  drops the Replit `origin` from the expo-router plugin.
- `hooks/useColors.ts` selects the palette directly instead of via a cast that
  did not typecheck. **The same type error still exists in `artifacts/mobile`.**
- pnpm catalog (`catalog:`) versions are resolved to concrete ranges, deps are
  split into `dependencies`/`devDependencies`, and `babel-preset-expo` is
  declared explicitly (pnpm hoisting supplied it implicitly in the monorepo).

Native builds still work from here (`npm run dev` serves iOS/Android too), but
`artifacts/mobile` remains the source of truth for the Replit deployment —
changes made in either place have to be carried across by hand.

## Verified

`npm run build` produces `dist/` (a ~3.4 MB JS bundle plus assets), and the
export was served and loaded in a browser: React mounts and no runtime errors
are thrown. Rendering past the splash needs a real Clerk key.
