# APS Load — standalone web build

A self-contained copy of the **Athlete Load Decision Tool** (Expo Router app,
"ATPRX Athlete Center") set up to build as a static web app and deploy as its
own Vercel project.

**Open access** — there is no login/account system. All assessment history is
stored locally on-device (`AsyncStorage`), nothing is synced to a backend.

It is a *copy*, not a workspace package: it has no `@workspace/*` dependencies,
no pnpm-workspace linkage, and its own lockfile. It is already a complete repo.

## Deploying to Vercel

Push this repo to GitHub (already done if you're reading this from there),
then import it in Vercel. `vercel.json` supplies the build settings, so no
framework preset is needed — leave Vercel's framework detection on "Other".

## Environment variables

Optional — the app runs fully standalone with no environment variables set.
Set these in Vercel (Project → Settings → Environment Variables) and locally in
`.env` (see `.env.example`) only if you want to point it at a backend API.
`EXPO_PUBLIC_*` values are inlined into the client bundle at build time, so
they must be public-safe and a rebuild is required after changing them.

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | no | Full origin of an API server, e.g. `https://api.example.com`. Unset (the default) → the app runs on local storage only. |
| `EXPO_PUBLIC_DOMAIN` | no | Bare-domain fallback for the above (`https://` is prepended). |

If you do wire up an API, its CORS config must allow the Vercel origin, since
the web app would call it cross-origin.

## Commands

```bash
npm install
npm run web        # dev server in a browser
npm run dev        # Expo dev server (also serves iOS/Android)
npm run build      # static web export into dist/
npm run typecheck  # tsc --noEmit
```

## How it differs from the Load app monorepo's `artifacts/mobile`

- No Clerk/auth — the sign-in flow, account settings, and subscription
  paywall were removed. `SubscriptionContext` reports everyone as
  subscribed so nothing is gated; `HistoryContext` is local-storage-only.
- `@workspace/api-client-react` is vendored into `lib/api-client/`; imports use
  the `@/lib/api-client` path alias. Its `index.ts` also re-exports
  `customFetch`, which the upstream package's barrel did not export even though
  `services/*Api.ts` import it from there.
- API base URL reads `EXPO_PUBLIC_API_URL` first, falling back to
  `EXPO_PUBLIC_DOMAIN`. Upstream only understood the Replit-supplied domain.
- `app.json` declares `web.bundler: metro` and `web.output: single` (SPA), and
  drops the Replit `origin` from the expo-router plugin.
- `hooks/useColors.ts` selects the palette directly instead of via a cast that
  did not typecheck. **The same type error still exists in `artifacts/mobile`.**
- pnpm catalog (`catalog:`) versions are resolved to concrete ranges, deps are
  split into `dependencies`/`devDependencies`, and `babel-preset-expo` is
  declared explicitly (pnpm hoisting supplied it implicitly in the monorepo).

Native builds still work from here (`npm run dev` serves iOS/Android too), but
the Load app monorepo remains the source of truth for the Replit/Clerk-backed
deployment — changes made in either place have to be carried across by hand.

## Verified

`npm run build` produces `dist/` (a ~3 MB JS bundle plus assets), and the
export was served and loaded in a browser: it goes straight into onboarding
and the app's Home/History/Learn/Settings tabs, no login screen, no console
errors.
