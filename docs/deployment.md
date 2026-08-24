# Store Deployment

## Environment variables

Configure these separately for Preview and Production. Values shown here are placeholders.

```env
STORE_ENABLED=true
ATLAS_API_URL=https://dashboard-preview.example.com
ATLAS_STOREFRONT_API_KEY=replace-with-the-matching-atlas-secret
ATLAS_VERCEL_BYPASS_SECRET=replace-with-the-dashboard-preview-bypass-secret
AUTH_SECRET=replace-with-a-separate-session-secret
NEXT_PUBLIC_SITE_URL=https://store-preview.example.com
```

`ATLAS_API_URL`, `ATLAS_STOREFRONT_API_KEY`, `ATLAS_VERCEL_BYPASS_SECRET`, and
`AUTH_SECRET` are server-only. `NEXT_PUBLIC_SITE_URL` is the only value intended for the
browser bundle. Do not configure Wayl or Vercel Blob credentials in this project; those
operations stay inside Atlas.

Preview and Production must use different API and session secrets. Preview must point to
the Atlas staging branch URL, while Production points to `https://dashboard.laheeb.coffee`.

## Protected Preview verification

Generate an automation bypass under the Store project's Vercel Deployment Protection
settings. Provide it only to the remote test runner as:

```env
VERCEL_AUTOMATION_BYPASS_SECRET=replace-with-the-store-preview-bypass-secret
```

The Playwright configuration sends the bypass header to the protected Store Preview. It is
not an application credential and must not be committed.

## Coordinated staging release

1. Merge and deploy the Atlas `staging` branch without build cache.
2. Verify its migration, catalog API, private media route, CORS, and Wayl staging client.
3. Merge and deploy the Store `staging` branch without build cache.
4. Run the remote desktop and mobile storefront journey against the exact Store deployment.
5. Inspect Preview runtime logs and browser assets for leaked secrets.

Production must not be deployed until both staging applications pass and the release receives
explicit approval.
